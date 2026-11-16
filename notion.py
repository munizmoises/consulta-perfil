import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

URL_API = "https://api.notion.com/v1"

HEADERS = {
    "Authorization": f"Bearer {os.environ.get('NOTION_TOKEN')}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}


class ErroNotion(Exception):
    pass


def consultar(database_id):
    # o notion manda de 100 em 100, vai pedindo até acabar
    paginas = []
    cursor = None
    while True:
        payload = {"page_size": 100}
        if cursor:
            payload["start_cursor"] = cursor
        resp = None
        for tentativa in range(3):  # às vezes o notion demora, tenta de novo antes de desistir
            try:
                resp = requests.post(f"{URL_API}/databases/{database_id}/query", headers=HEADERS, json=payload, timeout=30)
                break
            except requests.RequestException as e:
                if tentativa == 2:
                    raise ErroNotion(str(e)) from e
                time.sleep(2)
        if resp.status_code != 200:
            raise ErroNotion(f"[{resp.status_code}] {resp.text[:200]}")

        dados = resp.json()
        paginas.extend(dados.get("results", []))
        if not dados.get("has_more"):
            return paginas
        cursor = dados.get("next_cursor")


def prop(props, nome):
    if nome in props:
        return props[nome]
    nome = nome.lower()
    return next((v for k, v in props.items() if k.lower() == nome), None)


def texto(prop_notion):
    if not prop_notion:
        return ""
    tipo = prop_notion.get("type")
    valor = prop_notion.get(tipo)

    if tipo in ("title", "rich_text"):
        return "".join(t.get("plain_text", "") for t in valor or []).strip()
    if tipo in ("select", "status"):
        return (valor or {}).get("name", "").strip()
    if tipo == "multi_select":
        return " / ".join(o["name"].strip() for o in valor or [] if o.get("name"))
    if tipo == "unique_id":
        prefixo, numero = valor.get("prefix"), valor.get("number")
        return f"{prefixo}-{numero}" if prefixo else str(numero or "")
    if tipo == "files":
        urls = []
        for arq in valor or []:
            nome = (arq.get("name") or "").strip()
            if nome.startswith("assets/"):
                urls.append(nome)
            elif arq.get("type") in ("external", "file"):
                url = arq[arq["type"]].get("url", "").strip()
                if url:
                    urls.append(url)
            elif nome:
                urls.append(nome)
        return ", ".join(urls)
    return ""


def titulo(props):
    return next((texto(v) for v in props.values() if v.get("type") == "title"), "")


def codigos_existentes(database_id):
    return {titulo(p.get("properties", {})).upper() for p in consultar(database_id)} - {""}


def coluna_status(database_id):
    resp = requests.get(f"{URL_API}/databases/{database_id}", headers=HEADERS, timeout=20)
    if resp.status_code == 200:
        for nome, p in resp.json().get("properties", {}).items():
            if nome.lower() == "status":
                return nome, p.get("type", "status")
    return "status", "status"


def valor_status(tipo, nome="Publicado"):
    return {tipo: {"name": nome}}
