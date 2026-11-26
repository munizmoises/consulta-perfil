import json
import os
import re
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS

import fotos
import notion
from cores import CORES
from sistemas import COR_OUTRAS_LINHAS, SISTEMAS, achar

app = Flask(__name__)
CORS(app)

ID_SUB_PERFIS = os.environ.get("ID_PERFIS") or os.environ.get("ID_SUB_PERFIS")
ID_SUB_ACESSORIOS = os.environ.get("ID_ACESSORIOS") or os.environ.get("ID_SUB_ACESSORIOS")
CHAVE_SYNC = os.environ.get("SYNC_CHAVE")
ID_TIPOLOGIAS = os.environ.get("ID_TIPOLOGIAS")

CAMPOS_SUBSTITUICAO = ["substituicao", "nome", "apelido", "observacao", "sistema", "imagem", "imagem_sub"]
CAMPOS_SUBSTITUICAO_ACESSORIO = CAMPOS_SUBSTITUICAO + ["tipo", "unidade_conversao"]

CAMPOS_PERFIL = [
    "codigo_original", "medidas_mm", "medidas_polegadas", "raio_canto_mm",
    "nome", "apelido", "peso", "encaixe", "tipologia", "acabamento", "observacao", "sistema",
    "jx", "jy", "wx", "wy", "grafico", "imagem", "imagem_3d", "imagem_aplicavel", "barra", "sistemas",
]
CAMPOS_ACESSORIO = [
    "nome", "apelido", "aplicavel", "acabamento", "material", "tipo", "unidade_conversao",
    "observacao", "sistema", "imagem", "imagem_3d", "imagem_aplicavel", "sistemas",
]

cache_substituicoes = {"perfis": [], "acessorios": []}
cache_sistemas = {chave: {"perfis": [], "acessorios": [], "graficos": []} for chave in SISTEMAS}
cache_catalogo = {"sistemas": [], "cores": CORES, "tipologias": [], "graficos_desempenho": [], "perfis": [], "acessorios": []}
cache_tipologias = []
erros_sync = {}

def publicado(props):
    status = notion.texto(notion.prop(props, "status"))
    return not status or status.lower() in ("publicado", "ativo")

def ordenar_por_id(itens):
    def chave(item):
        numeros = re.findall(r"\d+", item.get("id", ""))
        return int(numeros[0]) if numeros else 999999
    return sorted(itens, key=chave)

def ler_itens(database_id, campos, extras=None):
    if not database_id:
        return []
    itens = []
    for pagina in notion.consultar(database_id):
        props = pagina.get("properties", {})
        if not publicado(props):
            continue
        codigo = notion.texto(notion.prop(props, "codigo") or notion.prop(props, "Nome"))
        if not codigo:
            continue
        item = {"id": notion.texto(notion.prop(props, "ID")), "codigo": codigo}
        item.update({c: notion.texto(notion.prop(props, c)) for c in campos})
        item.update(extras or {})
        itens.append(item)
    return ordenar_por_id(itens)

def separar(texto, sep=","):
    return [s.strip() for s in texto.split(sep) if s.strip()]

def ler_graficos(database_id, sistema):
    if not database_id:
        return []
    graficos = []
    for pagina in notion.consultar(database_id):
        props = pagina.get("properties", {})
        if not publicado(props):
            continue
        id_graf = notion.texto(notion.prop(props, "id") or notion.prop(props, "Nome"))
        if not id_graf:
            continue

        ler = lambda nome: notion.texto(notion.prop(props, nome))
        perfis = separar(ler("perfis_envolvidos"))
        detalhes = []
        for linha in ler("detalhes_perfis").split("\n"):
            linha = linha.strip()
            if linha:
                cod = re.match(r"[A-Za-z0-9\-]+", linha)
                detalhes.append({"codigo": cod.group(0) if cod else id_graf, "nome": linha, "jx": "", "wx": ""})

        graficos.append({
            "id": id_graf,
            "sistema": ler("sistema") or sistema["nome"],
            "sistema_chave": sistema["chave"],
            "tipologia": ler("tipologia"),
            "perfis_envolvidos": perfis,
            "composicao_perfis": separar(ler("composicao_perfis")) or perfis,
            "detalhes_perfis": detalhes,
            "descricao_montagem": ler("descricao_montagem"),
            "imagem_grafico": ler("imagem_grafico"),
            "inercia_total": {eixo: ler(f"{eixo}_total") for eixo in ("jx", "jy", "wx", "wy")},
        })
    return graficos

def remontar_catalogo():
    global cache_catalogo
    novo = {"sistemas": [], "cores": CORES, "tipologias": cache_tipologias, "graficos_desempenho": [], "perfis": [], "acessorios": []}
    indice = fotos.indexar()
    indice_graficos = fotos.indexar_graficos()
    chave_por_nome = {s["nome"].lower(): k for k, s in SISTEMAS.items()}
    for chave, sis in SISTEMAS.items():
        dados = cache_sistemas[chave]
        novo["sistemas"].append({"chave": chave, "nome": sis["nome"], "edicao": sis["edicao"], "cor": sis["cor"]})
        for grupo, tipo in (("perfis", "perfil"), ("acessorios", "acessorio")):
            novo[grupo].extend(fotos.completar(i, tipo, indice, fotos.pastas_do_item(i, chave_por_nome)) for i in dados[grupo])
        for g in dados["graficos"]:
            novo["graficos_desempenho"].extend(fotos.completar_graficos(g, indice_graficos))
    cache_catalogo = novo

def sincronizar_substituicoes():
    global cache_substituicoes
    try:
        cache_substituicoes = {
            "perfis": ler_itens(ID_SUB_PERFIS, CAMPOS_SUBSTITUICAO),
            "acessorios": ler_itens(ID_SUB_ACESSORIOS, CAMPOS_SUBSTITUICAO_ACESSORIO),
        }
        erros_sync.pop("substituicoes", None)
    except notion.ErroNotion as e:
        erros_sync["substituicoes"] = str(e)
        print(f"Substituições: falha no Notion, mantendo o cache anterior. {e}")
        return
    print(f"Substituições: {len(cache_substituicoes['perfis'])} perfis e {len(cache_substituicoes['acessorios'])} acessórios.")

def baixar_sistema(sis):
    extras = {"sistema_chave": sis["chave"]}
    perfis = ler_itens(sis["perfis"], CAMPOS_PERFIL, extras)
    acessorios = ler_itens(sis["acessorios"], CAMPOS_ACESSORIO, extras)
    for item in perfis + acessorios:
        item["sistema"] = item["sistema"] or sis["nome"]
    return {"perfis": perfis, "acessorios": acessorios, "graficos": ler_graficos(sis["graficos"], sis)}

def sincronizar_sistema(sis):
    try:
        cache_sistemas[sis["chave"]] = baixar_sistema(sis)
        erros_sync.pop(sis["chave"], None)
    except notion.ErroNotion as e:
        erros_sync[sis["chave"]] = str(e)
        print(f"{sis['nome']}: falha no Notion, mantendo o cache anterior. {e}")
        return
    d = cache_sistemas[sis["chave"]]
    if d["perfis"] or d["acessorios"] or d["graficos"]:
        print(f"{sis['nome']}: {len(d['perfis'])}P / {len(d['acessorios'])}A / {len(d['graficos'])}G.")

def sincronizar_tipologias():
    global cache_tipologias
    if not ID_TIPOLOGIAS:
        return
    chave_por_nome = {s["nome"].lower(): s["chave"] for s in SISTEMAS.values()}
    try:
        lista = []
        for pagina in notion.consultar(ID_TIPOLOGIAS):
            props = pagina.get("properties", {})
            if not publicado(props):
                continue
            ler = lambda nome: notion.texto(notion.prop(props, nome))
            sistema = ler("sistema")
            lista.append({
                "tipologia": notion.titulo(props).strip(),
                "sistema": sistema,
                "sistema_chave": chave_por_nome.get(sistema.lower(), ""),
                "grupo": ler("grupo"),
                "perfis": ler("perfis"),
                "componentes": ler("componentes"),
                "observacao": ler("observacao"),
            })
        cache_tipologias = lista
        erros_sync.pop("tipologias", None)
        print(f"Tipologias: {len(lista)}.")
    except notion.ErroNotion as e:
        erros_sync["tipologias"] = str(e)
        print(f"Tipologias: falha no Notion, mantendo o cache anterior. {e}")

def sincronizar_catalogo():
    configurados = [s for s in SISTEMAS.values() if s["perfis"] or s["acessorios"] or s["graficos"]]
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(sincronizar_sistema, configurados))
    sincronizar_tipologias()
    remontar_catalogo()

def sincronizar_tudo():
    sincronizar_substituicoes()
    sincronizar_catalogo()

ARQUIVO_CACHE = os.path.join(tempfile.gettempdir(), "consulta_perfil_cache.json")
estado = {"carregado": False, "ultima": None, "versao": 0.0}
sync_atual = {"thread": None}
trava_sync = threading.Lock()

def agora():
    return datetime.now(timezone(timedelta(hours=-3))).strftime("%d/%m/%Y %H:%M")

def sincronizando():
    t = sync_atual["thread"]
    return t is not None and t.is_alive()

def gravar_cache_no_disco():
    dados = {"substituicoes": cache_substituicoes, "sistemas": cache_sistemas,
             "tipologias": cache_tipologias, "ultima": estado["ultima"]}
    temporario = f"{ARQUIVO_CACHE}.{os.getpid()}"
    with open(temporario, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False)
    os.replace(temporario, ARQUIVO_CACHE)
    estado["versao"] = os.path.getmtime(ARQUIVO_CACHE)

def ler_cache_do_disco():
    global cache_substituicoes, cache_tipologias
    try:
        versao = os.path.getmtime(ARQUIVO_CACHE)
        if versao <= estado["versao"]:
            return
        with open(ARQUIVO_CACHE, encoding="utf-8") as f:
            dados = json.load(f)
    except (OSError, ValueError):
        return
    cache_substituicoes = dados["substituicoes"]
    cache_tipologias = dados["tipologias"]
    for chave, valor in dados["sistemas"].items():
        if chave in cache_sistemas:
            cache_sistemas[chave] = valor
    remontar_catalogo()
    estado.update(carregado=True, ultima=dados.get("ultima"), versao=versao)

def sincronizar_por_fora(funcao):
    with trava_sync:
        if sincronizando():
            return False
        
        def rodar():
            try:
                funcao()
                estado["ultima"] = agora()
                gravar_cache_no_disco()
            except Exception as e:
                erros_sync["sync"] = str(e)
                print(f"Sync parou com erro: {e}")
            finally:
                # Libera a API mesmo com erro
                estado["carregado"] = True
        sync_atual["thread"] = threading.Thread(target=rodar, daemon=True)
        sync_atual["thread"].start()
    return True

def resumo():
    return {
        "sincronizando": sincronizando(),
        "ultima_sincronizacao": estado["ultima"],
        "substituicoes": {k: len(v) for k, v in cache_substituicoes.items()},
        "catalogo": {
            "perfis": len(cache_catalogo["perfis"]),
            "acessorios": len(cache_catalogo["acessorios"]),
            "graficos": len(cache_catalogo["graficos_desempenho"]),
        },
        "erros": erros_sync,
    }

@app.before_request
def preparar():
    ler_cache_do_disco()
    if not estado["carregado"]:
        sincronizar_por_fora(sincronizar_tudo)
    if CHAVE_SYNC and request.path.startswith("/api/sync"):
        enviada = request.headers.get("X-Sync-Chave") or request.args.get("chave")
        if enviada != CHAVE_SYNC:
            return jsonify({"status": "erro", "mensagem": "Chave de sincronização inválida."}), 401

CARREGANDO = ({"status": "carregando", "mensagem": "A API acabou de acordar e ainda está lendo o Notion."}, 503)

@app.get("/api/substituicoes")
def get_substituicoes():
    if not estado["carregado"]:
        return CARREGANDO
    # Cor de cada sistema pros selos
    sistemas = [{"chave": s["chave"], "nome": s["nome"], "cor": s["cor"]} for s in SISTEMAS.values()]
    sistemas += [{"chave": nome.lower(), "nome": nome, "cor": cor} for nome, cor in COR_OUTRAS_LINHAS.items()]
    return jsonify({**cache_substituicoes, "sistemas": sistemas})


@app.get("/api/catalogo")
def get_catalogo():
    return jsonify(cache_catalogo) if estado["carregado"] else CARREGANDO

@app.get("/api/catalogo/codigos")
def get_codigos_catalogo():
    # Códigos com ficha no catálogo
    if not estado["carregado"]:
        return CARREGANDO
    codigos = [{"codigo": i["codigo"], "sistema": i["sistema_chave"], "aba": aba}
               for aba in ("perfis", "acessorios") for i in cache_catalogo[aba]]
    return jsonify(codigos)

def falta(item, campo, final=""):
    caminhos = [c.strip() for c in str(item.get(campo) or "").split(",") if c.strip() and "NO-PHOTO" not in c]
    return not any(c.lower().endswith(final) for c in caminhos)

@app.get("/api/pendencias")
def get_pendencias():
    # O que ainda falta de foto, 3D e gráfico em cada sistema
    if not estado["carregado"]:
        return CARREGANDO
    sistemas = {}
    novo = lambda chave: {"nome": SISTEMAS[chave]["nome"] if chave in SISTEMAS else chave, "perfis": {"total": 0, "sem_foto": [], "sem_3d": []},
                          "acessorios": {"total": 0, "sem_foto": [], "sem_3d": []}, "graficos": {"total": 0, "sem_imagem": []}}
    for aba in ("perfis", "acessorios"):
        for i in cache_catalogo[aba]:
            s = sistemas.setdefault(i["sistema_chave"], novo(i["sistema_chave"]))[aba]
            s["total"] += 1
            if falta(i, "imagem"):
                s["sem_foto"].append(i["codigo"])
            if falta(i, "imagem_3d", ".stl"):
                s["sem_3d"].append(i["codigo"])
    for g in cache_catalogo["graficos_desempenho"]:
        s = sistemas.setdefault(g["sistema_chave"], novo(g["sistema_chave"]))["graficos"]
        s["total"] += 1
        if not fotos.existe(g.get("imagem_grafico") or "x"):
            s["sem_imagem"].append(g["id"])
    total = lambda aba, campo: sum(len(s[aba][campo]) for s in sistemas.values())
    resumo_geral = {"perfis_sem_foto": total("perfis", "sem_foto"), "perfis_sem_3d": total("perfis", "sem_3d"),
                    "acessorios_sem_foto": total("acessorios", "sem_foto"), "acessorios_sem_3d": total("acessorios", "sem_3d"),
                    "graficos_sem_imagem": total("graficos", "sem_imagem")}
    return jsonify({"resumo": resumo_geral, "sistemas": sistemas})

@app.route("/api/sync", methods=["GET", "POST"])
@app.route("/api/sync/tudo", methods=["GET", "POST"])
def sync_tudo():
    return responder_sync("tudo", sincronizar_tudo)


@app.route("/api/sync/substituicoes", methods=["GET", "POST"])
def sync_substituicoes():
    return responder_sync("substituicoes", sincronizar_substituicoes)

@app.route("/api/sync/catalogo", methods=["GET", "POST"])
@app.route("/api/sync/sistemas", methods=["GET", "POST"])
def sync_catalogo():
    return responder_sync("catalogo", sincronizar_catalogo)

@app.route("/api/sync/sistema/<nome>", methods=["GET", "POST"])
def sync_sistema(nome):
    sis = achar(nome)
    if not sis:
        return jsonify({"status": "erro", "mensagem": f"Sistema '{nome}' não existe."}), 404

    def um_sistema():
        sincronizar_sistema(sis)
        remontar_catalogo()
    return responder_sync(sis["nome"], um_sistema)

def responder_sync(escopo, funcao):
    # Responde na hora, o andamento fica no /health
    comecou = sincronizar_por_fora(funcao)
    status = "sincronizando" if comecou else "ja_estava_sincronizando"
    return jsonify({"status": status, "escopo": escopo, "acompanhe": "/health", **resumo()}), 202

@app.get("/health")
def health():
    return jsonify({"status": "online", "carregado": estado["carregado"], **resumo()}), 200

if __name__ != "__main__" or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    sincronizar_por_fora(sincronizar_tudo)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
