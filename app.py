import os
import re
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

NOTION_TOKEN = os.environ.get("NOTION_TOKEN")

# SUBSTITUIÇÕES
ID_SUB_PERFIS = os.environ.get("ID_PERFIS") or os.environ.get("ID_SUB_PERFIS")
ID_SUB_ACESSORIOS = os.environ.get("ID_ACESSORIOS") or os.environ.get("ID_SUB_ACESSORIOS")

# CATÁLOGO 
SISTEMAS_CONFIG = {
    "chroma": {
        "nome": "Chroma",
        "perfis": os.environ.get("ID_CAT_PERFIS_CHROMA"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_CHROMA"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_CHROMA"),
    },
    "ecoline": {
        "nome": "Ecoline",
        "perfis": os.environ.get("ID_CAT_PERFIS_ECOLINE"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_ECOLINE"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_ECOLINE"),
    },
    "ecostick": {
        "nome": "Ecostick",
        "perfis": os.environ.get("ID_CAT_PERFIS_ECOSTICK"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_ECOSTICK"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_ECOSTICK"),
    },
    "diversos": {
        "nome": "Diversos",
        "perfis": os.environ.get("ID_CAT_PERFIS_DIVERSOS"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_DIVERSOS"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_DIVERSOS"),
    },
    "grandline": {
        "nome": "Grandline",
        "perfis": os.environ.get("ID_CAT_PERFIS_GRANDLINE"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_GRANDLINE"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_GRANDLINE"),
    },
    "ecogrid": {
        "nome": "Ecogrid",
        "perfis": os.environ.get("ID_CAT_PERFIS_ECOGRID"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_ECOGRID"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_ECOGRID"),
    },
    "tabelados": {
        "nome": "Tabelados",
        "perfis": os.environ.get("ID_CAT_PERFIS_TABELADOS"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_TABELADOS"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_TABELADOS"),
    },
    "sophia": {
        "nome": "Sophia",
        "perfis": os.environ.get("ID_CAT_PERFIS_SOPHIA"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_SOPHIA"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_SOPHIA"),
    },
    "minimalframe": {
        "nome": "Minimalframe",
        "perfis": os.environ.get("ID_CAT_PERFIS_MINIMALFRAME"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_MINIMALFRAME"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_MINIMALFRAME"),
    },
    "wallframe": {
        "nome": "Wallframe",
        "perfis": os.environ.get("ID_CAT_PERFIS_WALLFRAME"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_WALLFRAME"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_WALLFRAME"),
    },
    "slidinglass": {
        "nome": "Slidinglass",
        "perfis": os.environ.get("ID_CAT_PERFIS_SLIDINGLASS"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_SLIDINGLASS"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_SLIDINGLASS"),
    },
    "fachada_ventilada": {
        "nome": "Fachada Ventilada",
        "perfis": os.environ.get("ID_CAT_PERFIS_FACHADA_VENTILADA"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_FACHADA_VENTILADA"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_FACHADA_VENTILADA"),
    },
    "artus": {
        "nome": "Artus",
        "perfis": os.environ.get("ID_CAT_PERFIS_ARTUS"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_ARTUS"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_ARTUS"),
    },
    "unnion": {
        "nome": "Unnion",
        "perfis": os.environ.get("ID_CAT_PERFIS_UNNION"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_UNNION"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_UNNION"),
    },
    "erus": {
        "nome": "Erus",
        "perfis": os.environ.get("ID_CAT_PERFIS_ERUS"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_ERUS"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_ERUS"),
    },
    "vantor_90": {
        "nome": "Vantor 90",
        "perfis": os.environ.get("ID_CAT_PERFIS_VANTOR_90"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_VANTOR_90"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_VANTOR_90"),
    },
    "linha_moveleira": {
        "nome": "Linha Moveleira",
        "perfis": os.environ.get("ID_CAT_PERFIS_LINHA_MOVELEIRA"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_LINHA_MOVELEIRA"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_LINHA_MOVELEIRA"),
    },
    "kit_sacada_certa": {
        "nome": "Kit Sacada Certa",
        "perfis": os.environ.get("ID_CAT_PERFIS_KIT_SACADA_CERTA"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_KIT_SACADA_CERTA"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_KIT_SACADA_CERTA"),
    },
    "linha_implementos_rodoviarios": {
        "nome": "Linha Implementos Rodoviários",
        "perfis": os.environ.get("ID_CAT_PERFIS_IMPLEMENTOS_RODOVIARIOS"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_IMPLEMENTOS_RODOVIARIOS"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_IMPLEMENTOS_RODOVIARIOS"),
    },
    "linha_25": {
        "nome": "Linha 25",
        "perfis": os.environ.get("ID_CAT_PERFIS_LINHA_25"),
        "acessorios": os.environ.get("ID_CAT_ACESSORIOS_LINHA_25"),
        "graficos": os.environ.get("ID_CAT_GRAFICOS_LINHA_25"),
    },
}

HEADERS_NOTION = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

cache_substituicoes = {
    "perfis": [],
    "acessorios": []
}

cache_sistemas_catalogo = {
    chave: {"perfis": [], "acessorios": [], "graficos": []}
    for chave in SISTEMAS_CONFIG
}

cache_catalogo = {
    "graficos_desempenho": [],
    "perfis": [],
    "acessorios": []
}

def extrair_texto(prop):
    if not prop: return ""
    tipo = prop.get("type")

    if tipo == "unique_id":
        uid = prop.get("unique_id", {})
        prefixo = uid.get("prefix") or ""
        numero = uid.get("number") or ""
        return f"{prefixo}-{numero}" if prefixo else str(numero)

    elif tipo == "files":
        ficheiros = prop.get("files", [])
        if not ficheiros: return ""
        urls = []
        for arq in ficheiros:
            nome = (arq.get("name") or "").strip()
            if nome.startswith("assets/"):
                urls.append(nome)
            elif arq.get("type") == "external":
                u = arq.get("external", {}).get("url", "").strip()
                if u: urls.append(u)
            elif arq.get("type") == "file":
                u = arq.get("file", {}).get("url", "").strip()
                if u: urls.append(u)
            elif nome:
                urls.append(nome)
        return ", ".join(urls)

    elif tipo == "title":
        titulos = prop.get("title", [])
        return "".join(t.get("plain_text", "") for t in titulos).strip()

    elif tipo == "rich_text":
        textos = prop.get("rich_text", [])
        return "".join(t.get("plain_text", "") for t in textos).strip()

    elif tipo == "select":
        sel = prop.get("select")
        return sel.get("name", "").strip() if sel else ""

    elif tipo == "multi_select":
        opcoes = prop.get("multi_select", [])
        return " / ".join(o.get("name", "").strip() for o in opcoes if o.get("name"))

    elif tipo == "status":
        st = prop.get("status")
        return st.get("name", "").strip() if st else ""

    return ""

def obter_prop(props, nome_alvo):
    if nome_alvo in props: return props[nome_alvo]
    alvo_low = nome_alvo.lower()
    for k, v in props.items():
        if k.lower() == alvo_low: return v
    return None

def ordenar_por_id(lista_itens):
    def chave(item):
        val = item.get("id", "")
        numeros = re.findall(r"\d+", val)
        return int(numeros[0]) if numeros else 999999
    return sorted(lista_itens, key=chave)

def buscar_tabela_substituicoes(database_id, tipo_tabela="perfil"):
    if not database_id: return []
    url = f"https://api.notion.com/v1/databases/{database_id}/query"
    itens = []
    tem_mais = True
    cursor = None

    while tem_mais:
        payload = {"page_size": 100}
        if cursor: payload["start_cursor"] = cursor
        try:
            resp = requests.post(url, headers=HEADERS_NOTION, json=payload, timeout=20)
        except Exception: break
        if resp.status_code != 200: break

        dados = resp.json()
        for pag in dados.get("results", []):
            props = pag.get("properties", {})
            status_val = extrair_texto(obter_prop(props, "status"))
            if status_val and status_val.lower() not in ("publicado", "ativo"):
                continue

            codigo_val = extrair_texto(obter_prop(props, "codigo") or obter_prop(props, "Nome"))
            if not codigo_val: continue

            item = {
                "id": extrair_texto(obter_prop(props, "ID")),
                "codigo": codigo_val,
                "substituicao": extrair_texto(obter_prop(props, "substituicao")),
                "nome": extrair_texto(obter_prop(props, "nome")),
                "apelido": extrair_texto(obter_prop(props, "apelido")),
                "observacao": extrair_texto(obter_prop(props, "observacao")),
                "sistema": extrair_texto(obter_prop(props, "sistema")),
                "imagem": extrair_texto(obter_prop(props, "imagem")),
                "imagem_sub": extrair_texto(obter_prop(props, "imagem_sub")),
                "status": status_val or "Publicado"
            }
            if tipo_tabela == "acessorio":
                item["tipo"] = extrair_texto(obter_prop(props, "tipo"))
                item["unidade_conversao"] = extrair_texto(obter_prop(props, "unidade_conversao"))

            itens.append(item)

        tem_mais = dados.get("has_more", False)
        cursor = dados.get("next_cursor")

    return ordenar_por_id(itens)

def buscar_tabela_catalogo(database_id, tipo_tabela="perfil", sistema_padrao="Chroma"):
    if not database_id: return []
    url = f"https://api.notion.com/v1/databases/{database_id}/query"
    itens = []
    tem_mais = True
    cursor = None

    while tem_mais:
        payload = {"page_size": 100}
        if cursor: payload["start_cursor"] = cursor
        try:
            resp = requests.post(url, headers=HEADERS_NOTION, json=payload, timeout=20)
        except Exception: break
        if resp.status_code != 200: break

        dados = resp.json()
        for pag in dados.get("results", []):
            props = pag.get("properties", {})
            status_val = extrair_texto(obter_prop(props, "status"))
            if status_val and status_val.lower() not in ("publicado", "ativo"):
                continue

            codigo_val = extrair_texto(obter_prop(props, "codigo") or obter_prop(props, "Nome"))
            if not codigo_val: continue

            if tipo_tabela == "perfil":
                item = {
                    "id": extrair_texto(obter_prop(props, "ID")),
                    "codigo": codigo_val,
                    "nome": extrair_texto(obter_prop(props, "nome")),
                    "apelido": extrair_texto(obter_prop(props, "apelido")),
                    "peso": extrair_texto(obter_prop(props, "peso")),
                    "encaixe": extrair_texto(obter_prop(props, "encaixe")),
                    "tipologia": extrair_texto(obter_prop(props, "tipologia")),
                    "acabamento": extrair_texto(obter_prop(props, "acabamento")),
                    "observacao": extrair_texto(obter_prop(props, "observacao")),
                    "sistema": extrair_texto(obter_prop(props, "sistema")) or sistema_padrao,
                    "jx": extrair_texto(obter_prop(props, "jx")),
                    "jy": extrair_texto(obter_prop(props, "jy")),
                    "wx": extrair_texto(obter_prop(props, "wx")),
                    "wy": extrair_texto(obter_prop(props, "wy")),
                    "grafico": extrair_texto(obter_prop(props, "grafico")),
                    "imagem": extrair_texto(obter_prop(props, "imagem")),
                    "imagem_3d": extrair_texto(obter_prop(props, "imagem_3d")),
                    "imagem_aplicavel": extrair_texto(obter_prop(props, "imagem_aplicavel")),
                    "edicao": extrair_texto(obter_prop(props, "edicao"))
                }
            else:
                item = {
                    "id": extrair_texto(obter_prop(props, "ID")),
                    "codigo": codigo_val,
                    "nome": extrair_texto(obter_prop(props, "nome")),
                    "apelido": extrair_texto(obter_prop(props, "apelido")),
                    "aplicavel": extrair_texto(obter_prop(props, "aplicavel")),
                    "acabamento": extrair_texto(obter_prop(props, "acabamento")),
                    "material": extrair_texto(obter_prop(props, "material")),
                    "tipo": extrair_texto(obter_prop(props, "tipo")),
                    "unidade_conversao": extrair_texto(obter_prop(props, "unidade_conversao")),
                    "observacao": extrair_texto(obter_prop(props, "observacao")),
                    "sistema": extrair_texto(obter_prop(props, "sistema")) or sistema_padrao,
                    "imagem": extrair_texto(obter_prop(props, "imagem")),
                    "imagem_3d": extrair_texto(obter_prop(props, "imagem_3d")),
                    "imagem_aplicavel": extrair_texto(obter_prop(props, "imagem_aplicavel")),
                    "edicao": extrair_texto(obter_prop(props, "edicao"))
                }
            itens.append(item)

        tem_mais = dados.get("has_more", False)
        cursor = dados.get("next_cursor")

    return ordenar_por_id(itens)

def buscar_tabela_graficos(database_id, sistema_padrao="Chroma"):
    """Consulta a tabela de Gráficos no Notion."""
    if not database_id: return []
    url = f"https://api.notion.com/v1/databases/{database_id}/query"
    itens = []
    tem_mais = True
    cursor = None

    while tem_mais:
        payload = {"page_size": 100}
        if cursor: payload["start_cursor"] = cursor
        try:
            resp = requests.post(url, headers=HEADERS_NOTION, json=payload, timeout=20)
        except Exception: break
        if resp.status_code != 200: break

        dados = resp.json()
        for pag in dados.get("results", []):
            props = pag.get("properties", {})
            status_val = extrair_texto(obter_prop(props, "status"))
            if status_val and status_val.lower() not in ("publicado", "ativo"):
                continue

            id_graf = extrair_texto(obter_prop(props, "id") or obter_prop(props, "Nome"))
            if not id_graf: continue

            perfis_env_str = extrair_texto(obter_prop(props, "perfis_envolvidos"))
            perfis_env = [s.strip() for s in perfis_env_str.split(",") if s.strip()]

            comp_str = extrair_texto(obter_prop(props, "composicao_perfis"))
            comp = [s.strip() for s in comp_str.split(",") if s.strip()] if comp_str else perfis_env

            detalhes_str = extrair_texto(obter_prop(props, "detalhes_perfis"))
            detalhes_lista = []
            if detalhes_str:
                for linha in detalhes_str.split("\n"):
                    cod_m = re.findall(r"^[A-Za-z0-9\-]+", linha.strip())
                    cod = cod_m[0] if cod_m else id_graf
                    detalhes_lista.append({
                        "codigo": cod,
                        "nome": linha.strip(),
                        "jx": "",
                        "wx": ""
                    })

            item = {
                "id": id_graf,
                "sistema": extrair_texto(obter_prop(props, "sistema")) or sistema_padrao,
                "tipologia": extrair_texto(obter_prop(props, "tipologia")),
                "perfis_envolvidos": perfis_env,
                "composicao_perfis": comp,
                "detalhes_perfis": detalhes_lista,
                "descricao_montagem": extrair_texto(obter_prop(props, "descricao_montagem")),
                "imagem_grafico": extrair_texto(obter_prop(props, "imagem_grafico")),
                "inercia_total": {
                    "jx": extrair_texto(obter_prop(props, "jx_total")),
                    "jy": extrair_texto(obter_prop(props, "jy_total")),
                    "wx": extrair_texto(obter_prop(props, "wx_total")),
                    "wy": extrair_texto(obter_prop(props, "wy_total"))
                }
            }
            itens.append(item)

        tem_mais = dados.get("has_more", False)
        cursor = dados.get("next_cursor")

    return itens

def reconstruir_cache_catalogo():
    global cache_catalogo
    todos_perfis = []
    todos_acessorios = []
    todos_graficos = []
    for chave in SISTEMAS_CONFIG:
        todos_perfis.extend(cache_sistemas_catalogo[chave]["perfis"])
        todos_acessorios.extend(cache_sistemas_catalogo[chave]["acessorios"])
        todos_graficos.extend(cache_sistemas_catalogo[chave]["graficos"])

    cache_catalogo = {
        "graficos_desempenho": todos_graficos,
        "perfis": todos_perfis,
        "acessorios": todos_acessorios
    }

def sincronizar_substituicoes():
    global cache_substituicoes
    print("Sincronizando Substituições com o Notion...")
    perfis_sub = buscar_tabela_substituicoes(ID_SUB_PERFIS, tipo_tabela="perfil")
    acess_sub = buscar_tabela_substituicoes(ID_SUB_ACESSORIOS, tipo_tabela="acessorio")
    cache_substituicoes = {
        "perfis": perfis_sub,
        "acessorios": acess_sub
    }
    print(f"Substituições prontas: {len(perfis_sub)} perfis e {len(acess_sub)} acessórios.")

def sincronizar_sistema_catalogo(chave_sistema):
    chave = chave_sistema.strip().lower().replace("-", "_").replace(" ", "_")
    if chave not in SISTEMAS_CONFIG: return False

    cfg = SISTEMAS_CONFIG[chave]
    db_p = cfg.get("perfis")
    db_a = cfg.get("acessorios")
    db_g = cfg.get("graficos")
    nome_sis = cfg.get("nome", chave.capitalize())

    if not db_p and not db_a and not db_g: return True

    print(f"Sincronizando sistema '{nome_sis}' (Perfis, Acessórios e Gráficos) com o Notion...")
    perfis_sis = buscar_tabela_catalogo(db_p, tipo_tabela="perfil", sistema_padrao=nome_sis) if db_p else []
    acess_sis = buscar_tabela_catalogo(db_a, tipo_tabela="acessorio", sistema_padrao=nome_sis) if db_a else []
    graficos_sis = buscar_tabela_graficos(db_g, sistema_padrao=nome_sis) if db_g else []

    cache_sistemas_catalogo[chave] = {
        "perfis": perfis_sis,
        "acessorios": acess_sis,
        "graficos": graficos_sis
    }
    reconstruir_cache_catalogo()
    print(f"Sistema '{nome_sis}' pronto: {len(perfis_sis)}P / {len(acess_sis)}A / {len(graficos_sis)}G.")
    return True

def sincronizar_todos_sistemas_catalogo():
    print("Sincronizando TODOS os sistemas do Catálogo com o Notion...")
    for chave, cfg in SISTEMAS_CONFIG.items():
        if cfg.get("perfis") or cfg.get("acessorios") or cfg.get("graficos"):
            sincronizar_sistema_catalogo(chave)
    reconstruir_cache_catalogo()

def sincronizar_tudo():
    sincronizar_substituicoes()
    sincronizar_todos_sistemas_catalogo()

# ==========================================
# ROTAS DA API
# ==========================================
@app.route("/api/substituicoes", methods=["GET"])
def get_substituicoes():
    return jsonify(cache_substituicoes)

@app.route("/api/catalogo", methods=["GET"])
def get_catalogo():
    return jsonify(cache_catalogo)

@app.route("/api/sync", methods=["POST", "GET"])
@app.route("/api/sync/tudo", methods=["POST", "GET"])
def sync_tudo_route():
    sincronizar_tudo()
    return jsonify({
        "status": "sucesso",
        "escopo": "tudo",
        "mensagem": "Base de Dados completa sincronizada com o Notion!",
        "substituicoes": {
            "perfis": len(cache_substituicoes["perfis"]),
            "acessorios": len(cache_substituicoes["acessorios"])
        },
        "catalogo": {
            "perfis": len(cache_catalogo["perfis"]),
            "acessorios": len(cache_catalogo["acessorios"]),
            "graficos": len(cache_catalogo["graficos_desempenho"])
        }
    })

@app.route("/api/sync/substituicoes", methods=["POST", "GET"])
def sync_substituicoes_route():
    sincronizar_substituicoes()
    return jsonify({
        "status": "sucesso",
        "escopo": "substituicoes",
        "perfis": len(cache_substituicoes["perfis"]),
        "acessorios": len(cache_substituicoes["acessorios"])
    })

@app.route("/api/sync/catalogo", methods=["POST", "GET"])
@app.route("/api/sync/sistemas", methods=["POST", "GET"])
def sync_catalogo_route():
    sincronizar_todos_sistemas_catalogo()
    return jsonify({
        "status": "sucesso",
        "escopo": "catalogo_completo",
        "perfis": len(cache_catalogo["perfis"]),
        "acessorios": len(cache_catalogo["acessorios"]),
        "graficos": len(cache_catalogo["graficos_desempenho"])
    })

@app.route("/api/sync/sistema/<nome_sistema>", methods=["POST", "GET"])
def sync_sistema_especifico_route(nome_sistema):
    chave = nome_sistema.strip().lower().replace("-", "_").replace(" ", "_")
    ok = sincronizar_sistema_catalogo(chave)
    if not ok:
        return jsonify({"status": "erro", "mensagem": f"Sistema '{nome_sistema}' não configurado."}), 404

    dados_sis = cache_sistemas_catalogo.get(chave, {"perfis": [], "acessorios": [], "graficos": []})
    return jsonify({
        "status": "sucesso",
        "escopo": f"sistema_{chave}",
        "mensagem": f"Sistema '{SISTEMAS_CONFIG[chave]['nome']}' sincronizado com sucesso!",
        "perfis": len(dados_sis["perfis"]),
        "acessorios": len(dados_sis["acessorios"]),
        "graficos": len(dados_sis["graficos"])
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "online"}), 200

# Inicialização
sincronizar_tudo()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)