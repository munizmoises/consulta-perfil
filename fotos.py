import os
import re

RAIZ = os.path.dirname(os.path.abspath(__file__))
PASTA = os.path.join(RAIZ, "assets", "img", "catalog", "sistemas")
CAMPO_DA_PASTA = {"": "imagem", "normal": "imagem", "aplicada": "imagem_aplicavel", "3D": "imagem_3d"}
PREFIXOS = {"AP", "3D"}
EXTENSOES = (".webp", ".png", ".jpg", ".jpeg")


def normalizar(codigo):
    return re.sub(r"[^A-Z0-9]", "", (codigo or "").upper())


# Foto com vários códigos (A_B.webp) vale pra todos, _2 e _3 são a 2ª e a 3ª foto
def indexar():
    indice = {}
    if not os.path.isdir(PASTA):
        return indice
    for pasta, _, arquivos in os.walk(PASTA):
        partes = os.path.relpath(pasta, PASTA).replace("\\", "/").split("/")
        if len(partes) < 2 or partes[1] not in ("perfil", "acessorio"):
            continue
        sistema, tipo, sub = partes[0], partes[1], "/".join(partes[2:])
        campo = CAMPO_DA_PASTA.get(sub)
        if not campo:
            continue
        for nome in arquivos:
            base, ext = os.path.splitext(nome)
            if ext.lower() not in EXTENSOES:
                continue
            partes_nome = [p for p in base.split("_") if p]
            ordem = 1
            if len(partes_nome) > 1 and partes_nome[-1].isdigit() and len(partes_nome[-1]) <= 2:
                ordem = int(partes_nome.pop())
            codigos = [p for p in partes_nome if p.upper() not in PREFIXOS]
            caminho = "/".join(["assets/img/catalog/sistemas", sistema, tipo] + ([sub] if sub else []) + [nome])
            for codigo in codigos:
                indice.setdefault((sistema, tipo, campo, normalizar(codigo)), []).append((ordem, len(codigos), caminho))
    return indice


def existe(caminho):
    return caminho.startswith("http") or os.path.isfile(os.path.join(RAIZ, caminho))


# Junta as fotos achadas com as do Notion, sem repetir
def completar(item, tipo, indice, pastas):
    novo = dict(item)
    codigo = normalizar(item.get("codigo"))
    for campo in ("imagem", "imagem_aplicavel", "imagem_3d"):
        achadas = sorted({f for pasta in pastas for f in indice.get((pasta, tipo, campo, codigo), [])})
        if not achadas:
            continue
        atuais = [c.strip() for c in str(item.get(campo) or "").split(",") if c.strip()]
        lista = [c for c in atuais if c.lower().endswith(".stl") or existe(c)]
        # A mesma foto em duas pastas aparece uma vez só
        nomes = {os.path.basename(c).lower() for c in lista}
        for _, _, f in achadas:
            if os.path.basename(f).lower() not in nomes:
                lista.append(f)
                nomes.add(os.path.basename(f).lower())
        novo[campo] = ", ".join(lista)
    return novo


def pastas_do_item(item, chave_por_nome):
    pastas = [item.get("sistema_chave", "")]
    if pastas[0] == "diversos":
        pastas += [chave_por_nome.get(s.strip().lower(), "") for s in str(item.get("sistemas") or "").split("|")]
    return [p for p in pastas if p]
