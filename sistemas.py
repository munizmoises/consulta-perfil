import os
from dotenv import load_dotenv

load_dotenv()

# chave (usada no front e nas pastas de imagem), nome, edição do catálogo, sufixo das variáveis no .env
LISTA = [
    ("chroma", "Chroma", "Ed. 11 · Dezembro/2025", "CHROMA"),
    ("ecoline", "Ecoline 2.5", "Ed. 7 · Dezembro/2025", "ECOLINE"),
    ("ecostick", "Ecostick", "Ed. 6 · Dezembro/2025", "ECOSTICK"),
    ("diversos", "Diversos", "Última alteração: Outubro/2026", "DIVERSOS"),
    ("gradline", "Gradline", "Ed. 12 · Dezembro/2025", "GRADLINE"),
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

SISTEMAS = {
    chave: {
        "chave": chave,
        "nome": nome,
        "edicao": edicao,
        "perfis": os.environ.get(f"ID_CAT_PERFIS_{sufixo}"),
        "acessorios": os.environ.get(f"ID_CAT_ACESSORIOS_{sufixo}"),
        "graficos": os.environ.get(f"ID_CAT_GRAFICOS_{sufixo}"),
    }
    for chave, nome, edicao, sufixo in LISTA
}


def achar(nome):
    chave = (nome or "").strip().lower().replace("-", "_").replace(" ", "_")
    return SISTEMAS.get(chave)
