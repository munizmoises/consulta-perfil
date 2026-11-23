import os
from dotenv import load_dotenv

load_dotenv()

LISTA = [
    ("chroma", "Chroma", "Ed. 12 · Novembro/2026", "CHROMA"),
    ("ecoline", "Ecoline 2.5", "Ed. 7 · Dezembro/2025", "ECOLINE"),
    ("ecostick", "Ecostick", "Ed. 6 · Dezembro/2025", "ECOSTICK"),
    ("diversos", "Diversos", "Última alteração: Outubro/2026", "DIVERSOS"),
    ("gradline", "Gradline", "Ed. 15 · Novembro/2026", "GRADLINE"),
    ("ecogrid", "Ecogrid", "Ed. 7 · Dezembro/2025", "ECOGRID"),
    ("linha_25", "Linha 25", "Última alteração: Outubro/2026", "LINHA_25"),
    ("tabelados", "Tabelados", "Ed. 3 · Dezembro/2025", "TABELADOS"),
    ("sophia", "Sophia", "Ed. 7 · Dezembro/2025", "SOPHIA"),
    ("minimalframe", "Minimalframe", "Ed. 3 · Dezembro/2025", "MINIMALFRAME"),
    ("wallframe", "Wallframe", "Ed. 4 · Dezembro/2025", "WALLFRAME"),
    ("slidinglass", "Slidinglass", "Ed. 3 · Outubro/2026", "SLIDINGLASS"),
    ("fachada_ventilada", "Fachada Ventilada", "Ed. 3 · Agosto/2026", "FACHADA_VENTILADA"),
    ("artus", "Artus", "Ed. 4 · Outubro/2026", "ARTUS"),
    ("unnion", "Unnion", "Ed. 8 · Outubro/2026", "UNNION"),
    ("erus", "Erus", "Ed. 5 · Novembro/2026", "ERUS"),
    ("vantor_90", "Vantor 90", "Ed. 1 · Maio/2025", "VANTOR_90"),
    ("kit_sacada_certa", "Kit Sacada Certa", "Ed. 1 · Novembro/2025", "KIT_SACADA_CERTA"),
    ("freeview", "FreeView", "Última alteração: Agosto/2024", "FREEVIEW"),
    ("implementos_rodoviarios", "Linha Implementos Rodoviários", "Ed. 3 · Setembro/2016", "IMPLEMENTOS_RODOVIARIOS"),
]

COR_SISTEMA = {
    "chroma": "#298FC9", "ecoline": "#E3AA1B", "ecostick": "#8AAE3E", "diversos": "#6B7280", "gradline": "#94AD49",
    "ecogrid": "#004E97", "linha_25": "#6B7280", "tabelados": "#4E6E94", "sophia": "#417F92", "minimalframe": "#BE0A26",
    "wallframe": "#7C3D1A", "slidinglass": "#2A7F82", "fachada_ventilada": "#B03A2E", "artus": "#800000",
    "unnion": "#C53823", "erus": "#EB3E1B", "vantor_90": "#2E9C9A", "kit_sacada_certa": "#E64121",
    "freeview": "#90C66A", "implementos_rodoviarios": "#E0A800",
}

COR_OUTRAS_LINHAS = {"Gold": "#E3AA1B"}

SISTEMAS = {
    chave: {
        "chave": chave,
        "nome": nome,
        "edicao": edicao,
        "cor": COR_SISTEMA.get(chave, "#6B7280"),
        "perfis": os.environ.get(f"ID_CAT_PERFIS_{sufixo}"),
        "acessorios": os.environ.get(f"ID_CAT_ACESSORIOS_{sufixo}"),
        "graficos": os.environ.get(f"ID_CAT_GRAFICOS_{sufixo}"),
    }
    for chave, nome, edicao, sufixo in LISTA
}

def achar(nome):
    chave = (nome or "").strip().lower().replace("-", "_").replace(" ", "_")
    return SISTEMAS.get(chave)
