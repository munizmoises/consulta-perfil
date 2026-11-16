# serve só pra dar uma ideia na tela, não pra comparar com a peça de verdade.
LISTA = [
    ("NAT", "Natural", "Natural", "#E1E4E6"),
    ("BR000PE", "Branco", "Branco Perfil Liso Brilhante RAL 9003", "#F4F4F4"),
    ("BR002EP", "Branco Puro", "Branco Liso Brilhante RAL 9010", "#F1ECE1"),
    ("PR000PE", "Preto", "Preto Liso Fosco RAL 9005", "#0A0A0A"),
    ("PR000EP", "Preto", "Preto Liso Fosco RAL 9005", "#0A0A0A"),
    ("BZ001PE", "Bronze Claro", "Bronze Claro 1001", "#8C7853"),
    ("BZ002PE", "Bronze", "Bronze Médio 1002 Metálico", "#433E2E"),
    ("BZ003PE", "Bronze Escuro", "Bronze Escuro 1003", "#2F2A22"),
    ("CH000PE", "Champanhe", "Champanhe Metálico Perita", "#C9B68A"),
    ("FO000PE", "Natural Fosco", "Natural Fosco Metálico", "#C8CACB"),
    ("FO23", "Anodizado", "Anodizado Fosco A23 (FO23)", "#C3C6C8"),
    ("CZ001PE", "Cinza", "Cinza Fosco RAL 7021", "#2E3234"),
    ("CZ002PE", "Cinza Grafite", "Cinza Grafite Liso Fosco RAL 7024", "#45494E"),
    ("CZ004PE", "Cinza Brilhante", "Cinza Liso Brilhante RAL 7043", "#4F5250"),
    ("CZ005PE", "Cinza Fosco", "Cinza Liso Fosco RAL 7043", "#4F5250"),
    ("CZ006PE", "Cinza Alumínio", "Cinza Alumínio Semi Fosco RAL 9006", "#A5A8A6"),
    ("CZ009PE", "Cinza Claro", "Cinza Liso Fosco RAL 9007", "#8F8F8C"),
    ("CZ011PE", "Grafite Metálico", "Cinza Grafite Microtexturizado Metálico", "#4A4D50"),
    ("AC002PE", "Aço Corten", "Aço Corten Microtexturizado 2", "#8B4A2B"),
]

CORES = [{"codigo": c, "nome": n, "descricao": d, "hex": h} for c, n, d, h in LISTA]
POR_CODIGO = {c["codigo"]: c for c in CORES}


def texto_acabamento(codigos):
    # monta no mesmo formato que já tava no Chroma: "Natural (NAT) / Preto (PR000PE)"
    ordem = [c for c, *_ in LISTA]
    vistos = []
    for cod in sorted(codigos, key=lambda c: ordem.index(c) if c in ordem else 99):
        cor = POR_CODIGO.get(cod)
        if cor and cor["nome"] not in [v.split(" (")[0] for v in vistos]:
            vistos.append(f"{cor['nome']} ({cod})")
    return " / ".join(vistos)
