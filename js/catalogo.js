const NO_PHOTO = "assets/img/catalog/NO-PHOTO.webp";
const MAPA_ISOPLETAS_IMG = "assets/img/catalog/ISOPLETAS.webp";
const HISTORICO_KEY_PERFIS = "historico_catalogo_perfis";
const HISTORICO_KEY_ACESSORIOS = "historico_catalogo_acessorios";

let banco = { sistemas: [], graficos_desempenho: [], perfis: [], acessorios: [] };
let erroCarregamentoBanco = false;
let abaAtiva = "perfis";
let sistemaAtivo = "todos";

const EXEMPLOS_BUSCA = {};
let foraDeLinha = {}; // código -- item da tabela de substituições
let comparando = [];

let estadoPorAba = {
  perfis: {
    termo: "",
    itemSelecionado: null,
    jaInteragiu: false
  },
  acessorios: {
    termo: "",
    itemSelecionado: null,
    jaInteragiu: false
  }
};

const CAMPOS_PERFIL = [
  { chave: "peso",       rotulo: "Peso"       },
  { chave: "tipologia",  rotulo: "Tipologia"  },
  { chave: "acabamento", rotulo: "Acabamento" },
  { chave: "jx",         rotulo: "Momento de Inércia (Jx)" },
  { chave: "jy",         rotulo: "Momento de Inércia (Jy)" },
  { chave: "wx",         rotulo: "Módulo de Resistência (Wx)" },
  { chave: "wy",         rotulo: "Módulo de Resistência (Wy)" },
  { chave: "observacao", rotulo: "Observação", largo: true },
  { chave: "encaixe",    rotulo: "Perfis aplicáveis", largo: true, clicavel: true },
  { chave: "_acessorios", rotulo: "Acessórios aplicáveis", largo: true, clicavel: true },
];

const CAMPOS_ACESSORIO = [
  { chave: "acabamento",        rotulo: "Acabamento"  },
  { chave: "material",          rotulo: "Material"    },
  { chave: "tipo",              rotulo: "Tipo"        },
  { chave: "unidade_conversao", rotulo: "Unidade de conversão" },
  { chave: "observacao",        rotulo: "Observação",  largo: true },
  { chave: "aplicavel",         rotulo: "Aplicável nos perfis", largo: true, clicavel: true },
];

function extrairListaImagens(valor, padraoFallback = "") {
  let lista = [];
  if (Array.isArray(valor)) {
    lista = valor.map(v => String(v || "").trim()).filter(Boolean);
  } else if (typeof valor === "string" && valor.trim() !== "") {
    lista = valor.split(/[|,\r\n]+/).map(s => s.trim()).filter(Boolean);
  }
  if (lista.length === 0 && padraoFallback) {
    lista = [padraoFallback];
  }
  return lista.filter(src => !src.includes("NO-PHOTO"));
}

function obterPrimeiraImagem(valor, padraoFallback = NO_PHOTO) {
  const lista = extrairListaImagens(valor, "");
  return lista.length > 0 ? lista[0] : padraoFallback;
}

function imagemPadrao(item, pasta) {
  const sub = pasta === "acessorio" ? "acessorio/normal" : pasta;
  return `assets/img/catalog/sistemas/${item.sistema_chave || "chroma"}/${sub}/${item.codigo}.webp`;
}

function ordenarNatural(lista) {
  return (lista || []).sort((a, b) => {
    return (a.codigo || a.id || "").localeCompare(b.codigo || b.id || "", undefined, { numeric: true, sensitivity: 'base' });
  });
}

let compatReversa = {};
const codigosNoTexto = texto => (String(texto || "").toUpperCase().match(/[A-Z]{1,5}-?\d+[A-Z]?/g) || []).map(normalizar);
const comHifen = codigo => String(codigo).replace(/^([A-Z]+)(\d)/, "$1-$2");

function anotarReverso(sistema, alvo, tipo, codigo) {
  const chave = `${sistema}|${alvo}`;
  compatReversa[chave] = compatReversa[chave] || { perfis: [], acessorios: [] };
  if (!compatReversa[chave][tipo].includes(codigo)) compatReversa[chave][tipo].push(codigo);
}

// Acessório escrito no Encaixe vai pra Acessórios aplicáveis
let codigosPerfis = new Set(), codigosAcessorios = new Set();
function ehAcessorio(cod) {
  const n = normalizar(cod);
  return codigosAcessorios.has(n) && !codigosPerfis.has(n);
}

function semRepetir(lista) {
  const vistos = new Set();
  return lista.filter(c => { const n = normalizar(c); if (vistos.has(n)) return false; vistos.add(n); return true; });
}

function codigosDoCampo(item, chave, sistema) {
  const chaves = sistema ? [sistema, "diversos"] : [item.sistema_chave, ...(item._sistemas || [])];
  const reverso = { perfis: [], acessorios: [] };
  chaves.forEach(k => {
    const r = compatReversa[`${k}|${item._codNorm}`];
    if (r) ["perfis", "acessorios"].forEach(t => r[t].forEach(c => { if (!reverso[t].includes(c)) reverso[t].push(c); }));
  });
  const texto = item._encaixePorSistema && (chave === "encaixe" || chave === "_acessorios")
    ? (sistema ? item._encaixePorSistema[sistema] : Object.values(item._encaixePorSistema).join(" / "))
    : item[chave === "_acessorios" ? "encaixe" : chave];
  const proprios = [...new Set(String(texto || "").split("/").map(s => s.trim()).filter(Boolean))];
  if (chave === "_acessorios") return semRepetir([...proprios.filter(ehAcessorio), ...reverso.acessorios.map(comHifen)]);
  const vistos = new Set(proprios.flatMap(codigosNoTexto));
  const deVolta = reverso.perfis.filter(c => !vistos.has(normalizar(c)) && normalizar(c) !== item._codNorm);
  const lista = [...proprios, ...deVolta.map(comHifen)];
  return chave === "encaixe" ? lista.filter(c => !ehAcessorio(c)) : lista;
}

function separarPorSistema(texto) {
  const partes = {};
  String(texto || "").split("||").forEach(trecho => {
    const m = trecho.match(/^\s*([^:]+):\s*(.*)$/);
    const sis = m && acharSistema(m[1]);
    if (sis) partes[sis.chave] = m[2].trim();
  });
  return Object.keys(partes).length ? partes : null;
}

function indexarBancoCatalogo() {
  banco.perfis = ordenarNatural(banco.perfis);
  banco.acessorios = ordenarNatural(banco.acessorios);
  if (banco.graficos_desempenho) {
    banco.graficos_desempenho = ordenarNatural(banco.graficos_desempenho);
  }

  const todosItens = [...(banco.perfis || []), ...(banco.acessorios || [])];
  codigosPerfis = new Set((banco.perfis || []).map(p => normalizar(p.codigo || "")));
  codigosAcessorios = new Set((banco.acessorios || []).map(a => normalizar(a.codigo || "")));
  todosItens.forEach(item => {
    item._codNorm = normalizar(item.codigo || "");
    item._codBusca = normalizarBusca(item.codigo || "");

    item._sistemas = String(item.sistemas || "").split("|").map(s => acharSistema(s.trim())).filter(Boolean).map(s => s.chave);
    item._encaixePorSistema = item._sistemas.length ? separarPorSistema(item.encaixe) : null;
    item._buscaIndex = [
      item.codigo, item.nome, item.apelido, item.observacao,
      item.sistema, item.sistemas, item.tipologia, item.tipo, item.encaixe, item.aplicavel
    ].filter(Boolean).map(v => normalizarBusca(v)).join(" ");
  });

  (banco.graficos_desempenho || []).forEach(g => {
    g._perfisNorm = (g.perfis_envolvidos || []).map(c => normalizar(c));
  });

  compatReversa = {};
  (banco.perfis || []).forEach(p => {
    if (p._encaixePorSistema) {
      Object.entries(p._encaixePorSistema).forEach(([sis, txt]) => codigosNoTexto(txt).forEach(c => anotarReverso(sis, c, "perfis", p.codigo)));
      return;
    }
    codigosNoTexto(p.encaixe).forEach(c => anotarReverso(p.sistema_chave, c, "perfis", p.codigo));
  });
  (banco.acessorios || []).forEach(a => codigosNoTexto(a.aplicavel).forEach(c => anotarReverso(a.sistema_chave, c, "acessorios", a.codigo)));
}

function itemBateComTermo(item, termo) {
  const t = normalizarBusca(termo);
  return item._buscaIndex ? item._buscaIndex.includes(t) : false;
}

function itemPertenceAoSistema(item, chaveSistema) {
  return !chaveSistema || chaveSistema === "todos" || item.sistema_chave === chaveSistema
    || (item._sistemas || []).includes(chaveSistema);
}

function acharSistema(valor) {
  const alvo = normalizarBusca(valor);
  return (banco.sistemas || []).find(s => normalizarBusca(s.chave) === alvo || normalizarBusca(s.nome) === alvo);
}

// Cor do sistema 
function seloSistema(nome, chave) {
  const selo = criar("span", "ficha-sistema", nome);
  const sis = (banco.sistemas || []).find(s => s.chave === chave);
  if (sis && sis.cor) selo.style.setProperty("--cor-sistema", sis.cor);
  return selo;
}

function edicaoDoSistema(chave) {
  const sis = (banco.sistemas || []).find(s => s.chave === chave);
  return sis ? sis.edicao : "";
}

function coresDoItem(item) {
  const achadas = [...String(item.acabamento || "").matchAll(/\(([A-Z0-9]{2,8})\)/g)].map(m => m[1]);
  return achadas.map(cod => (banco.cores || []).find(c => c.codigo === cod)).filter(Boolean);
}

// Modelo 3D começa sempre no preto
let cor3DEscolhida = null;
const cor3D = () => cor3DEscolhida || "#25272b";

function ehCorClara(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
}

function montarCores(cores, trio) {
  const boxTecnica = trio.firstChild;
  const secao = criar("div", "ficha-cores");
  secao.appendChild(criar("span", "ficha-cores-rotulo", `Cores (${cores.length})`));
  const lista = criar("div", "ficha-cores-lista");

  const pintar = (cor, btn) => {
    const jaAtivo = btn.classList.contains("ativo");
    lista.querySelectorAll(".cor-chip").forEach(b => b.classList.remove("ativo"));
    if (!jaAtivo) btn.classList.add("ativo");

    cor3DEscolhida = jaAtivo ? null : cor.hex;
    document.dispatchEvent(new CustomEvent("cor-3d", { detail: cor3DEscolhida }));

    [...trio.children].forEach(box => {
      box.classList.toggle("pintado", !jaAtivo);
      box.classList.toggle("cor-clara", !jaAtivo && ehCorClara(cor.hex));
      if (!jaAtivo) box.style.setProperty("--cor-previa", cor.hex);
    });
  };

  cores.forEach(cor => {
    const btn = criar("button", "cor-chip");
    btn.type = "button";
    btn.title = `${cor.descricao} (${cor.codigo})`;
    const bolinha = criar("span", "cor-bolinha");
    bolinha.style.background = cor.hex;
    btn.append(bolinha, criar("span", "cor-nome", cor.nome), criar("small", "cor-codigo", cor.codigo));
    btn.addEventListener("click", () => pintar(cor, btn));
    lista.appendChild(btn);
  });

  secao.appendChild(lista);
  if (boxTecnica && boxTecnica.classList.contains("com-midia")) {
    const dica = criar("small", "ficha-cores-dica", "Clica numa cor pra ver o desenho pintado (a cor é aproximada).");
    secao.appendChild(dica);
    new MutationObserver((_, obs) => {
      if (!boxTecnica.classList.contains("com-midia")) { dica.remove(); obs.disconnect(); }
    }).observe(boxTecnica, { attributes: true, attributeFilter: ["class"] });
  }
  return secao;
}

function ehUltimaAlteracao(edicao) {
  return /altera/i.test(edicao || "");
}

function obterGraficosDoPerfil(item) {
  if (!item || !item.codigo) return [];
  const listaGlobal = banco.graficos_desempenho || [];
  const codNorm = item._codNorm || normalizar(item.codigo);

  const encontrados = listaGlobal.filter(g =>
    Array.isArray(g._perfisNorm)
      ? g._perfisNorm.includes(codNorm)
      : (Array.isArray(g.perfis_envolvidos) && g.perfis_envolvidos.some(c => normalizar(c) === codNorm))
  );

  if (encontrados.length > 0) return encontrados;

  if (item.grafico && item.grafico.trim() !== "" && !item.grafico.includes("NO-PHOTO")) {
    return [{
      id: `GRAF-${item.codigo}`,
      sistema: item.sistema || "Chroma",
      tipologia: item.tipologia || "Padrão",
      perfis_envolvidos: [item.codigo],
      composicao_perfis: [item.codigo],
      detalhes_perfis: [{
        codigo: item.codigo,
        nome: item.nome || "",
        jx: item.jx || "",
        jy: item.jy || "",
        wx: item.wx || "",
        wy: item.wy || ""
      }],
      descricao_montagem: `${item.nome || "Perfil"} (${item.codigo})`,
      imagem_grafico: item.grafico,
      inercia_total: {
        jx: item.jx || "",
        jy: item.jy || "",
        wx: item.wx || "",
        wy: item.wy || ""
      }
    }];
  }

  return [];
}

function obterChaveHistorico(aba = abaAtiva) {
  return aba === "perfis" ? HISTORICO_KEY_PERFIS : HISTORICO_KEY_ACESSORIOS;
}

function ehNomeDeSistema(valor) {
  return normalizarBusca(valor) === "todos" || Boolean(acharSistema(valor));
}

function salvarHistorico(codigo, aba = abaAtiva) {
  if (!codigo || !codigo.trim() || ehNomeDeSistema(codigo)) return;
  gravarHistorico(obterChaveHistorico(aba), codigo);
  renderizarHistorico();
}

function renderizarHistorico() {
  const container = document.getElementById("historico-container");
  if (!container) return;
  const chaveAtual = obterChaveHistorico(abaAtiva);
  const hist = lerHistorico(chaveAtual).filter(itemHist => !ehNomeDeSistema(itemHist));

  container.replaceChildren();
  if (hist.length === 0) return;

  const nomeAba = abaAtiva === "perfis" ? "Perfis" : "Acessórios";
  const cab = criar("div", "historico-cabecalho");
  cab.appendChild(criar("span", "historico-titulo", "Pesquisas recentes:"));
  const btnLimpar = criar("button", "historico-limpar", "");
  btnLimpar.type = "button";
  btnLimpar.title = `Limpar pesquisas recentes de ${nomeAba}`;
  btnLimpar.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  btnLimpar.addEventListener("click", () => {
    abrirModalConfirmacaoHistorico(
      `Tem certeza de que deseja apagar todas as pesquisas recentes de ${nomeAba}?`,
      () => {
        localStorage.removeItem(chaveAtual);
        container.replaceChildren();
      }
    );
  });
  cab.appendChild(btnLimpar);
  container.appendChild(cab);

  const lista = criar("div", "historico-lista");
  hist.forEach(itemHist => {
    const btn = criar("button", "historico-item", itemHist);
    btn.type = "button";
    btn.addEventListener("click", () => {
      estadoPorAba[abaAtiva].jaInteragiu = true;
      estadoPorAba[abaAtiva].termo = itemHist;
      const campo = document.getElementById("busca-catalogo");
      const limpar = document.querySelector("#form-catalogo .btn-limpar");
      campo.value = itemHist;
      if (limpar) limpar.hidden = false;
      executarFiltro();
    });
    lista.appendChild(btn);
  });
  container.appendChild(lista);
}

function abrirModalGraficoEstrutural(item, graficosDisponiveis) {
  const graficos = graficosDisponiveis && graficosDisponiveis.length > 0
    ? graficosDisponiveis
    : obterGraficosDoPerfil(item);

  if (graficos.length === 0) return;

  const modal = criar("div", "foto-modal");
  modal.setAttribute("aria-label", `Desempenho Estrutural - ${item.codigo}`);

  const conteudo = criar("div", "modal-estrutural-conteudo");

  const topo = criar("div", "modal-estrutural-topo");
  topo.appendChild(criar("h3", "", `Comportamento Estrutural e Pressão de Vento — ${item.codigo} (${item.nome})`));

  const btnFechar = criar("button", "btn btn-secundario");
  btnFechar.type = "button";
  btnFechar.innerHTML = '<i class="fa-solid fa-xmark"></i> Fechar';
  topo.appendChild(btnFechar);
  conteudo.appendChild(topo);

  const grid = criar("div", "modal-estrutural-grid");

  const colGrafico = criar("div", "modal-bloco-grafico");
  let graficoAtual = graficos[0];

  if (graficos.length > 1) {
    const seletorWrap = criar("div", "grafico-seletor-opcoes");
    const tituloSeletor = graficos.every(g => g.vista) ? "Gráficos disponíveis" : "Montagens e combinações disponíveis";
    seletorWrap.appendChild(criar("span", "grafico-seletor-label", `${tituloSeletor} (${graficos.length}):`));

    const botoesOpcoes = criar("div", "grafico-seletor-botoes");
    graficos.forEach((g, idx) => {
      const textoBtn = g.vista || g.tipologia || g.descricao_montagem || `Opção ${idx + 1}`;
      const btnOp = criar("button", "btn-opcao-grafico" + (idx === 0 ? " ativo" : ""), textoBtn);
      btnOp.type = "button";
      btnOp.addEventListener("click", () => {
        botoesOpcoes.querySelectorAll(".btn-opcao-grafico").forEach(b => b.classList.remove("ativo"));
        btnOp.classList.add("ativo");
        graficoAtual = g;
        atualizarMidiaGrafico(graficoAtual.imagem_grafico, `Gráfico de Desempenho Estrutural — ${graficoAtual.descricao_montagem || item.codigo}`);
        atualizarResumoMontagem(graficoAtual);
        atualizarObsMedidas(graficoAtual);
        btnCurvaPerfil.className = "btn btn-principal";
        btnMapaIsopletas.className = "btn btn-secundario";
      });
      botoesOpcoes.appendChild(btnOp);
    });

    seletorWrap.appendChild(botoesOpcoes);
    colGrafico.appendChild(seletorWrap);
  }

  const infoMontagem = criar("div", "grafico-info-montagem");
  colGrafico.appendChild(infoMontagem);

  function atualizarResumoMontagem(g) {
    infoMontagem.replaceChildren();

    const cabMontagem = criar("div", "grafico-montagem-cabecalho");
    cabMontagem.appendChild(criar("div", "grafico-montagem-titulo", g.descricao_montagem || `${item.codigo}`));
    if (g.tipologia) {
      cabMontagem.appendChild(criar("span", "grafico-montagem-sub", g.tipologia));
    }
    infoMontagem.appendChild(cabMontagem);

    const detalhes = g.detalhes_perfis || [];
    const contagem = {};
    detalhes.forEach(d => { contagem[d.codigo] = (contagem[d.codigo] || 0) + 1; });
    const unicos = [];
    const vistos = new Set();
    detalhes.forEach(d => {
      if (!vistos.has(d.codigo)) {
        vistos.add(d.codigo);
        unicos.push(d);
      }
    });

    if (unicos.length > 0) {
      const gradePerfis = criar("div", "grafico-perfis-composicao");
      unicos.forEach(d => {
        if (!d.jx && !d.wx && !d.jy && !d.wy) return;
        const cardP = criar("div", "grafico-perfil-mini");
        const qtdStr = contagem[d.codigo] > 1 ? ` (${contagem[d.codigo]}x)` : "";
        cardP.appendChild(criar("div", "grafico-perfil-mini-cod", `${d.codigo}${qtdStr}`));
        const metricas = [];
        if (d.jx) metricas.push(`JX: ${d.jx}`);
        if (d.wx) metricas.push(`WX: ${d.wx}`);
        if (d.jy && !d.jx) metricas.push(`JY: ${d.jy}`);
        if (d.wy && !d.wx) metricas.push(`WY: ${d.wy}`);
        cardP.appendChild(criar("div", "grafico-perfil-mini-val", metricas.join(" · ")));
        gradePerfis.appendChild(cardP);
      });
      if (gradePerfis.children.length > 0) {
        infoMontagem.appendChild(gradePerfis);
      }
    }

    if (g.inercia_total) {
      const partes = [];
      if (g.inercia_total.jx) partes.push(`Jx total = ${g.inercia_total.jx}`);
      if (g.inercia_total.wx) partes.push(`Wx total = ${g.inercia_total.wx}`);
      if (!g.inercia_total.jx && g.inercia_total.jy) partes.push(`Jy total = ${g.inercia_total.jy}`);
      if (!g.inercia_total.wx && g.inercia_total.wy) partes.push(`Wy total = ${g.inercia_total.wy}`);
      if (partes.length > 0) {
        infoMontagem.appendChild(criar("div", "grafico-montagem-inercia", partes.join("   |   ")));
      }
    }
  }

  const palcoImg = criar("div", "modal-palco-img");
  colGrafico.appendChild(palcoImg);

  // Desenho das medidas H e L
  const obsMedidas = criar("div", "grafico-obs-medidas");
  colGrafico.appendChild(obsMedidas);

  function atualizarObsMedidas(g) {
    obsMedidas.replaceChildren();
    obsMedidas.hidden = !g || !g.imagem_medidas;
    if (obsMedidas.hidden) return;
    const desenho = document.createElement("img");
    desenho.src = g.imagem_medidas;
    desenho.alt = `Medidas H e L — ${item.codigo}`;
    desenho.title = "Clique para ampliar a imagem";
    desenho.addEventListener("click", () => abrirFoto(desenho.src, desenho.alt));
    desenho.onerror = () => { obsMedidas.hidden = true; };
    const texto = criar("p", "");
    texto.innerHTML = "<strong>Observação:</strong> as medidas <strong>H</strong> e <strong>L</strong> deste gráfico são as indicadas no desenho.";
    obsMedidas.append(desenho, texto);
  }

  function atualizarMidiaGrafico(src, altText) {
    palcoImg.replaceChildren();
    const imgGrafico = document.createElement("img");
    imgGrafico.src = src;
    imgGrafico.alt = altText;
    imgGrafico.title = "Clique para ampliar a imagem";
    imgGrafico.addEventListener("click", () => abrirFoto(imgGrafico.src, imgGrafico.alt));
    imgGrafico.onerror = () => {
      palcoImg.replaceChildren();
      const avisoVazio = criar("div", "grafico-aviso-vazio");
      avisoVazio.innerHTML = `<i class="fa-solid fa-chart-line"></i><p> Sem imagem deste gráfico atualmente</p><small>${item.codigo}</small>`;
      palcoImg.appendChild(avisoVazio);
    };
    palcoImg.appendChild(imgGrafico);
  }

  atualizarResumoMontagem(graficoAtual);
  atualizarObsMedidas(graficoAtual);
  atualizarMidiaGrafico(graficoAtual.imagem_grafico, `Gráfico de Desempenho Estrutural — ${item.codigo}`);

  const barraBotoesGrafico = criar("div", "modal-grafico-acoes");
  const btnCurvaPerfil = criar("button", "btn btn-principal", `Gráfico do Perfil (${item.codigo})`);
  btnCurvaPerfil.type = "button";
  const btnMapaIsopletas = criar("button", "btn btn-secundario", "Ver Mapa das Regiões (Isopletas)");
  btnMapaIsopletas.type = "button";

  btnCurvaPerfil.addEventListener("click", () => {
    atualizarMidiaGrafico(graficoAtual.imagem_grafico, `Gráfico de Desempenho Estrutural — ${item.codigo}`);
    atualizarObsMedidas(graficoAtual);
    btnCurvaPerfil.className = "btn btn-principal";
    btnMapaIsopletas.className = "btn btn-secundario";
  });

  btnMapaIsopletas.addEventListener("click", () => {
    atualizarMidiaGrafico(MAPA_ISOPLETAS_IMG, "Mapa das Regiões de Vento (Isopletas - ABNT NBR 6123)");
    atualizarObsMedidas(null);
    btnMapaIsopletas.className = "btn btn-principal";
    btnCurvaPerfil.className = "btn btn-secundario";
  });

  barraBotoesGrafico.appendChild(btnCurvaPerfil);
  barraBotoesGrafico.appendChild(btnMapaIsopletas);
  colGrafico.appendChild(barraBotoesGrafico);
  grid.appendChild(colGrafico);

  const colRegiao = criar("div", "modal-bloco-regiao");

  const cardES = criar("div", "card-es-destaque");
  const tituloES = criar("h4", "");
  tituloES.innerHTML = '<i class="fa-solid fa-location-dot"></i> Referência Técnica (ABNT NBR 6123 / NBR 10821)';
  cardES.appendChild(tituloES);

  const p1 = criar("p", "");
  p1.style.margin = "0";
  p1.innerHTML = '<strong>1. Identificação da Região (NBR 6123):</strong><br>Identifique no <strong>Mapa das Isopletas</strong> a região da obra para verificar a velocidade básica do vento e a região climática correspondente ao local da edificação.<br><br><strong>2. Determinação da Pressão de Ensaio (Pe):</strong><br>Verifique na tabela ao lado a Pressão de Ensaio (<strong>Pe</strong>) compatível com a quantidade de pavimentos e a altura máxima da sua edificação.<br><br><strong>3. Como ler o gráfico ao lado:</strong><br>Com a Pressão de Ensaio (<strong>Pa</strong>) definida, cruze as dimensões de <strong>Largura (L) x Altura (H)</strong> da esquadria no gráfico. Para garantir a conformidade com as normas ABNT NBR 10821 e NBR 6123, o ponto de cruzamento deve ficar abaixo ou à esquerda da curva correspondente à pressão requerida.';
  cardES.appendChild(p1);
  colRegiao.appendChild(cardES);

  const wrapTab1 = criar("div", "tabela-ventos-wrap");
  const tabelaRegioes = document.createElement("table");
  tabelaRegioes.className = "tabela-ventos";
  tabelaRegioes.innerHTML = `
    <thead>
      <tr>
        <th rowspan="2">Região</th>
        <th colspan="2">Velocidade</th>
        <th colspan="2">Pressão</th>
      </tr>
      <tr>
        <th>m/s</th>
        <th>km/h</th>
        <th>kg/m²</th>
        <th>PA</th>
      </tr>
    </thead>
    <tbody>
      <tr class="destaque-es" title="Norte e Noroeste do Espírito Santo">
        <td><span class="cor-regiao-box" style="background:#a4d8f5;"></span>I (ES Norte)</td>
        <td>30</td>
        <td>108</td>
        <td>77</td>
        <td>756</td>
      </tr>
      <tr class="destaque-es" title="Grande Vitória, Vila Velha e Litoral/Sul do Espírito Santo">
        <td><span class="cor-regiao-box" style="background:#2680c2;"></span>II (ES Litoral / GV)</td>
        <td>35</td>
        <td>126</td>
        <td>105</td>
        <td>1030</td>
      </tr>
      <tr>
        <td><span class="cor-regiao-box" style="background:#90a0a8;"></span>III</td>
        <td>40</td>
        <td>144</td>
        <td>137</td>
        <td>1345</td>
      </tr>
      <tr>
        <td><span class="cor-regiao-box" style="background:#6c7880;"></span>IV</td>
        <td>45</td>
        <td>162</td>
        <td>173</td>
        <td>1698</td>
      </tr>
      <tr>
        <td><span class="cor-regiao-box" style="background:#414a50;"></span>V</td>
        <td>50</td>
        <td>180</td>
        <td>214</td>
        <td>2100</td>
      </tr>
    </tbody>
  `;
  wrapTab1.appendChild(tabelaRegioes);
  const notaBeaufort = criar("p", "nota-beaufort");
  notaBeaufort.innerHTML = "Nota: adotado para cálculo escala internacional de <strong>BEAUFORT</strong>";
  wrapTab1.appendChild(notaBeaufort);
  colRegiao.appendChild(wrapTab1);

  const wrapTab2 = criar("div", "tabela-ventos-wrap");
  const tabelaPavimentos = document.createElement("table");
  tabelaPavimentos.className = "tabela-ventos";
  tabelaPavimentos.innerHTML = `
    <thead>
      <tr>
        <th colspan="6">Tabela de pressão de ensaio para cargas uniformemente distribuídas</th>
      </tr>
      <tr>
        <th>Quant. de pavimentos</th>
        <th>Altura máxima</th>
        <th>Região do País</th>
        <th>Pressão de ensaio Pe (Pa)<br><small>Pe = Pp x 1,2</small></th>
        <th>Pressão de segurança Ps (Pa)<br><small>Ps = Pe x 1,5</small></th>
        <th>Pressão de água Pa (Pa)<br><small>Pa = Pp x 0,20</small></th>
      </tr>
    </thead>
    <tbody>
      <tr class="destaque-es"><td rowspan="5"><strong>02</strong></td><td rowspan="5"><strong>6 m</strong></td><td>I</td><td>350</td><td>520</td><td>60</td></tr>
      <tr class="destaque-es"><td>II</td><td>470</td><td>700</td><td>80</td></tr>
      <tr><td>III</td><td>610</td><td>920</td><td>100</td></tr>
      <tr><td>IV</td><td>770</td><td>1160</td><td>130</td></tr>
      <tr><td>V</td><td>950</td><td>1430</td><td>160</td></tr>

      <tr class="destaque-es"><td rowspan="5"><strong>05</strong></td><td rowspan="5"><strong>15 m</strong></td><td>I</td><td>420</td><td>640</td><td>70</td></tr>
      <tr class="destaque-es"><td>II</td><td>580</td><td>860</td><td>100</td></tr>
      <tr><td>III</td><td>750</td><td>1130</td><td>130</td></tr>
      <tr><td>IV</td><td>950</td><td>1430</td><td>160</td></tr>
      <tr><td>V</td><td>1180</td><td>1760</td><td>200</td></tr>

      <tr class="destaque-es"><td rowspan="5"><strong>10</strong></td><td rowspan="5"><strong>30 m</strong></td><td>I</td><td>500</td><td>750</td><td>80</td></tr>
      <tr class="destaque-es"><td>II</td><td>680</td><td>1030</td><td>110</td></tr>
      <tr><td>III</td><td>890</td><td>1340</td><td>150</td></tr>
      <tr><td>IV</td><td>1130</td><td>1700</td><td>190</td></tr>
      <tr><td>V</td><td>1400</td><td>2090</td><td>230</td></tr>

      <tr class="destaque-es"><td rowspan="5"><strong>20</strong></td><td rowspan="5"><strong>60 m</strong></td><td>I</td><td>600</td><td>900</td><td>100</td></tr>
      <tr class="destaque-es"><td>II</td><td>815</td><td>1220</td><td>140</td></tr>
      <tr><td>III</td><td>1060</td><td>1600</td><td>180</td></tr>
      <tr><td>IV</td><td>1350</td><td>2020</td><td>220</td></tr>
      <tr><td>V</td><td>1660</td><td>2500</td><td>280</td></tr>

      <tr class="destaque-es"><td rowspan="5"><strong>30</strong></td><td rowspan="5"><strong>90 m</strong></td><td>I</td><td>660</td><td>980</td><td>110</td></tr>
      <tr class="destaque-es"><td>II</td><td>890</td><td>1340</td><td>150</td></tr>
      <tr><td>III</td><td>1170</td><td>1750</td><td>200</td></tr>
      <tr><td>IV</td><td>1480</td><td>2210</td><td>250</td></tr>
      <tr><td>V</td><td>1820</td><td>2730</td><td>300</td></tr>
    </tbody>
  `;
  wrapTab2.appendChild(tabelaPavimentos);
  colRegiao.appendChild(wrapTab2);

  grid.appendChild(colRegiao);
  conteudo.appendChild(grid);
  modal.appendChild(conteudo);

  btnFechar.addEventListener("click", abrirModal(modal, "foto-aberta"));
}

function preencherUrl(url, item) {
  url.searchParams.set("codigo", item.codigo);
  const sistemaLink = (item._sistemas || []).includes(sistemaAtivo) ? sistemaAtivo : item.sistema_chave;
  if (sistemaLink) url.searchParams.set("sistema", sistemaLink);
  url.searchParams.set("aba", abaAtiva);
  return url;
}

function atualizarUrlItem(item) {
  const url = new URL(window.location);
  if (item && item.codigo) {
    preencherUrl(url, item);
  } else {
    ["codigo", "sistema", "aba"].forEach(p => url.searchParams.delete(p));
  }
  window.history.replaceState({}, "", url);
}

function copiarLinkCompartilhamento(item, btn) {
  const url = preencherUrl(new URL(window.location.origin + window.location.pathname), item);

  navigator.clipboard.writeText(url.toString()).then(() => {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
    setTimeout(() => { btn.innerHTML = originalHtml; }, 1800);
  });
}

function encontrarItemPorCodigo(codigoAlvo, sistemaPreferido = sistemaAtivo) {
  const codLimpo = normalizarBusca(codigoAlvo);

  if (sistemaPreferido && sistemaPreferido !== "todos") {
    let achadoSisPerf = banco.perfis.find(
      i => i._codBusca === codLimpo && itemPertenceAoSistema(i, sistemaPreferido)
    );
    if (achadoSisPerf) return { item: achadoSisPerf, aba: "perfis" };

    let achadoSisAcess = banco.acessorios.find(
      i => i._codBusca === codLimpo && itemPertenceAoSistema(i, sistemaPreferido)
    );
    if (achadoSisAcess) return { item: achadoSisAcess, aba: "acessorios" };
  }

  let achado = banco.perfis.find(i => i._codBusca === codLimpo);
  if (achado) return { item: achado, aba: "perfis" };

  achado = banco.acessorios.find(i => i._codBusca === codLimpo);
  if (achado) return { item: achado, aba: "acessorios" };

  return null;
}

function irParaPerfilCompleto(codigoAlvo, sistemaPreferido = sistemaAtivo, voltarPraTodos = false) {
  const resultado = encontrarItemPorCodigo(codigoAlvo, sistemaPreferido);
  const campoBusca = document.getElementById("busca-catalogo");
  const limpar = document.querySelector("#form-catalogo .btn-limpar");

  if (sistemaAtivo !== "todos" && (voltarPraTodos || !resultado || !itemPertenceAoSistema(resultado.item, sistemaAtivo))) {
    marcarSistemaAtivo("todos");
  }

  if (resultado && resultado.aba !== abaAtiva) {
    document.querySelectorAll(".catalogo-aba").forEach(b => b.classList.remove("catalogo-aba-ativa"));
    const btnAba = document.querySelector(`.catalogo-aba[data-aba="${resultado.aba}"]`);
    if (btnAba) btnAba.classList.add("catalogo-aba-ativa");
    abaAtiva = resultado.aba;
  }

  const codigoFormatado = resultado ? resultado.item.codigo : codigoAlvo.replace("-", "");
  estadoPorAba[abaAtiva].jaInteragiu = true;
  estadoPorAba[abaAtiva].termo = codigoFormatado;
  estadoPorAba[abaAtiva].itemSelecionado = resultado ? resultado.item : null;

  campoBusca.value = codigoFormatado;
  if (limpar) limpar.hidden = false;
  salvarHistorico(codigoFormatado, abaAtiva);
  renderizarHistorico();
  executarFiltro();
}

function criarBoxImagem(titulo, valorImagens, altBase, iconeVazio, textoVazio) {
  const box = criar("div", "ficha-box-img");
  box.appendChild(criar("span", "ficha-box-rotulo", titulo));

  const listaImgs = extrairListaImagens(valorImagens, "");
  let idxLocal = 0;

  const renderizarVazio = () => {
    box.replaceChildren();
    box.appendChild(criar("span", "ficha-box-rotulo", titulo));
    const vazio = criar("div", "ficha-box-vazio");
    vazio.innerHTML = `<i class="${iconeVazio}"></i><span>${textoVazio}</span>`;
    box.appendChild(vazio);
    box.classList.remove("com-midia");
    box.onclick = null;
  };

  if (listaImgs.length > 0) {
    const img = document.createElement("img");
    img.className = "ficha-box-midia";
    img.loading = "lazy";
    img.alt = `${altBase}`;
    img.src = listaImgs[0];

    let contadorBadge = null;
    if (listaImgs.length > 1) {
      contadorBadge = criar("span", "ficha-box-contador", `1/${listaImgs.length}`);
      box.appendChild(contadorBadge);
    }

    img.onerror = () => {
      listaImgs.splice(idxLocal, 1);
      if (listaImgs.length === 0) {
        renderizarVazio();
      } else {
        idxLocal = idxLocal % listaImgs.length;
        img.src = listaImgs[idxLocal];
        if (listaImgs.length === 1) {
          if (contadorBadge) contadorBadge.remove();
          box.querySelectorAll(".ficha-box-seta").forEach(b => b.remove());
        } else if (contadorBadge) {
          contadorBadge.textContent = `${idxLocal + 1}/${listaImgs.length}`;
        }
      }
    };

    const moldura = criar("span", "ficha-box-moldura");
    moldura.appendChild(img);
    box.appendChild(moldura);

    if (listaImgs.length > 1) {
      const trocarNoCard = (delta) => {
        idxLocal = (idxLocal + delta + listaImgs.length) % listaImgs.length;
        img.style.opacity = "0.25";
        setTimeout(() => {
          img.src = listaImgs[idxLocal];
          if (contadorBadge) contadorBadge.textContent = `${idxLocal + 1}/${listaImgs.length}`;
          img.style.opacity = "1";
        }, 100);
      };

      const btnEsq = criar("button", "ficha-box-seta esq");
      btnEsq.type = "button";
      btnEsq.title = "Imagem anterior";
      btnEsq.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
      btnEsq.addEventListener("click", (e) => {
        e.stopPropagation();
        trocarNoCard(-1);
      });

      const btnDir = criar("button", "ficha-box-seta dir");
      btnDir.type = "button";
      btnDir.title = "Próxima imagem";
      btnDir.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      btnDir.addEventListener("click", (e) => {
        e.stopPropagation();
        trocarNoCard(1);
      });

      box.appendChild(btnEsq);
      box.appendChild(btnDir);
    }

    box.classList.add("com-midia");
    box.title = `Clique para ampliar ${titulo}`;
    box.addEventListener("click", () => {
      const galeriaDesteTipo = listaImgs.map((s, i) => ({
        src: s,
        leg: `${altBase}${listaImgs.length > 1 ? " (" + (i + 1) + "/" + listaImgs.length + ")" : ""}`
      }));
      abrirFoto(galeriaDesteTipo, altBase, idxLocal);
    });
  } else {
    renderizarVazio();
  }

  return box;
}

const ehStl3D = (src) => /\.stl(\?.*)?$/i.test(src);
const ehEmbed3D = (src) => /^https?:\/\/\S+\.html?(\?.*)?$/i.test(src);
const tipoSlide3D = (src) => (ehStl3D(src) ? "stl" : (ehEmbed3D(src) ? "embed" : "img"));
const previewEmbed3D = (src) => src.replace(/index\.html?(\?.*)?$/i, "export/preview.jpg");

function abrirGaleria3D(slides, indiceInicial, altBase) {
  const lista = (slides || []).slice();
  if (lista.length === 0) return;
  let idx = Math.max(0, Math.min(indiceInicial || 0, lista.length - 1));
  let viewer = null, versao = 0;

  const modal = criar("div", "foto-modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", altBase || "Visualização 3D ampliada");

  const caixa = criar("div", "foto-modal-caixa foto-modal-caixa-3d");
  const legendaEl = criar("div", "foto-modal-legenda", "");
  caixa.appendChild(legendaEl);
  const palco = criar("div", "foto-modal-3d-palco");
  caixa.appendChild(palco);

  const legendaDe = (i) => `${altBase || ""}${lista.length > 1 ? " (" + (i + 1) + "/" + lista.length + ")" : ""}`;
  let contadorEl = null;

  const mostrar = () => {
    if (viewer) { viewer.vivo = false; viewer = null; }
    const meu = ++versao;
    const slide = lista[idx];
    palco.replaceChildren();
    legendaEl.textContent = legendaDe(idx);
    if (contadorEl) contadorEl.textContent = `${idx + 1} / ${lista.length}`;

    palco.classList.toggle("fundo-escuro", slide.tipo === "stl" && ehCorClara(cor3D()));
    if (slide.tipo === "stl") {
      palco.appendChild(criar("span", "foto-modal-3d-dica", "Arraste para girar · scroll para zoom · duplo clique reinicia"));
      viewer = Viewer3D.montar(palco, slide.src, { duploCliqueReinicia: true, cor: cor3D() });
      palco.addEventListener("viewer3d-erro", () => {
        if (meu !== versao) return;
        palco.replaceChildren(criar("p", "foto-modal-3d-erro", "Não foi possível carregar o modelo 3D."));
      }, { once: true });
    } else if (slide.tipo === "embed") {
      const frame = document.createElement("iframe");
      frame.className = "foto-modal-3d-iframe";
      frame.src = slide.src;
      frame.title = legendaDe(idx);
      frame.allow = "xr-spatial-tracking; camera; gyroscope; accelerometer; fullscreen";
      frame.allowFullscreen = true;
      palco.appendChild(frame);
      const link = criar("a", "foto-modal-3d-link", "Abrir em nova aba");
      link.href = slide.src;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      palco.appendChild(link);
    } else {
      const img = document.createElement("img");
      img.className = "foto-modal-3d-img";
      img.src = slide.src;
      img.alt = legendaDe(idx);
      palco.appendChild(img);
    }
  };

  const ir = (delta) => { idx = (idx + delta + lista.length) % lista.length; mostrar(); };

  if (lista.length > 1) {
    const btnEsq = criar("button", "foto-modal-seta esq");
    btnEsq.type = "button";
    btnEsq.setAttribute("aria-label", "Anterior");
    btnEsq.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    btnEsq.addEventListener("click", (e) => { e.stopPropagation(); ir(-1); });

    const btnDir = criar("button", "foto-modal-seta dir");
    btnDir.type = "button";
    btnDir.setAttribute("aria-label", "Próximo");
    btnDir.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    btnDir.addEventListener("click", (e) => { e.stopPropagation(); ir(1); });

    contadorEl = criar("span", "foto-modal-contador", "");
    caixa.appendChild(btnEsq);
    caixa.appendChild(btnDir);
    caixa.appendChild(contadorEl);
  }

  const btnFechar = criar("button", "foto-fechar");
  btnFechar.type = "button";
  btnFechar.setAttribute("aria-label", "Fechar");
  btnFechar.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  const fechar = () => {
    if (viewer) { viewer.vivo = false; viewer = null; }
    modal.classList.remove("foto-aberta");
    setTimeout(() => modal.remove(), 200);
    document.removeEventListener("keydown", keyListener);
  };
  const keyListener = (e) => {
    if (e.key === "Escape") fechar();
    if (lista.length > 1 && e.key === "ArrowLeft") ir(-1);
    if (lista.length > 1 && e.key === "ArrowRight") ir(1);
  };

  btnFechar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });
  document.addEventListener("keydown", keyListener);

  modal.appendChild(caixa);
  modal.appendChild(btnFechar);
  document.body.appendChild(modal);
  mostrar();

  modal.getBoundingClientRect();
  modal.classList.add("foto-aberta");
}

function criarBoxMidia3D(titulo, lista, altBase) {
  const slides = lista.map(src => ({ tipo: tipoSlide3D(src), src }));
  let idx = 0, viewer = null, versao = 0, contadorBadge = null, btnEsq = null, btnDir = null;

  const box = criar("div", "ficha-box-img com-midia ficha-box-3d");
  box.appendChild(criar("span", "ficha-box-rotulo", titulo));
  const palco = criar("div", "ficha-box-3d-palco");
  box.appendChild(palco);
  const dicaEl = criar("span", "ficha-box-3d-dica", "");
  box.appendChild(dicaEl);
  box.title = `Clique para ampliar ${titulo}`;

  const atualizarControles = () => {
    if (slides.length <= 1) {
      if (contadorBadge) { contadorBadge.remove(); contadorBadge = null; }
      if (btnEsq) { btnEsq.remove(); btnEsq = null; }
      if (btnDir) { btnDir.remove(); btnDir = null; }
    } else if (contadorBadge) {
      contadorBadge.textContent = `${idx + 1}/${slides.length}`;
    }
  };

  const removerSlideAtual = () => {
    slides.splice(idx, 1);
    if (slides.length === 0) {
      if (viewer) { viewer.vivo = false; viewer = null; }
      if (box.parentNode) box.replaceWith(criarBoxImagem(titulo, [], altBase, "fa-solid fa-cube", "Sem imagem 3D"));
      return;
    }
    idx = idx % slides.length;
    atualizarControles();
    mostrar();
  };

  const mostrar = () => {
    if (viewer) { viewer.vivo = false; viewer = null; }
    const meu = ++versao;
    const slide = slides[idx];
    palco.replaceChildren();
    if (contadorBadge) contadorBadge.textContent = `${idx + 1}/${slides.length}`;

    if (slide.tipo === "stl") {
      dicaEl.textContent = "Arraste para girar · clique para ampliar";
      viewer = Viewer3D.montar(palco, slide.src, { duploCliqueReinicia: false, cor: cor3D() });
      palco.addEventListener("viewer3d-erro", () => { if (meu === versao) removerSlideAtual(); }, { once: true });
    } else if (slide.tipo === "embed") {
      dicaEl.textContent = "Clique para abrir em 3D / RA";
      const mostrarPlaceholder = () => {
        if (meu !== versao) return;
        const vazio = criar("div", "ficha-box-3d-vazio");
        vazio.innerHTML = '<i class="fa-solid fa-cube"></i><span>Ver em 3D / RA</span>';
        palco.replaceChildren(vazio, criarSelo3D());
      };
      const img = document.createElement("img");
      img.className = "ficha-box-midia";
      img.loading = "lazy";
      img.alt = altBase;
      img.onerror = mostrarPlaceholder;
      img.src = previewEmbed3D(slide.src);
      palco.appendChild(img);
      palco.appendChild(criarSelo3D());
    } else {
      dicaEl.textContent = "Clique para ampliar";
      const img = document.createElement("img");
      img.className = "ficha-box-midia";
      img.loading = "lazy";
      img.alt = altBase;
      img.onerror = () => { if (meu === versao) removerSlideAtual(); };
      img.src = slide.src;
      palco.appendChild(img);
    }
  };

  function criarSelo3D() {
    const selo = criar("span", "ficha-box-3d-selo");
    selo.innerHTML = '<i class="fa-solid fa-cube"></i> 3D / RA';
    return selo;
  }

  if (slides.length > 1) {
    contadorBadge = criar("span", "ficha-box-contador", `1/${slides.length}`);
    box.appendChild(contadorBadge);

    const trocar = (delta) => { idx = (idx + delta + slides.length) % slides.length; mostrar(); };

    btnEsq = criar("button", "ficha-box-seta esq");
    btnEsq.type = "button";
    btnEsq.title = "Anterior";
    btnEsq.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    btnEsq.addEventListener("click", (e) => { e.stopPropagation(); trocar(-1); });

    btnDir = criar("button", "ficha-box-seta dir");
    btnDir.type = "button";
    btnDir.title = "Próximo";
    btnDir.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    btnDir.addEventListener("click", (e) => { e.stopPropagation(); trocar(1); });

    box.appendChild(btnEsq);
    box.appendChild(btnDir);
  }

  let inicio = null;
  box.addEventListener("pointerdown", (e) => { inicio = { x: e.clientX, y: e.clientY }; });
  box.addEventListener("click", (e) => {
    if (e.target.closest(".ficha-box-seta")) return;
    const moveu = inicio ? Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 6 : false;
    inicio = null;
    if (!moveu) abrirGaleria3D(slides, idx, altBase);
  });

  mostrar();
  return box;
}

function mostrarPreviewEncaixe(codClicado, containerPreview, btnClicado, wrapTags, sistema = sistemaAtivo) {
  if (btnClicado.classList.contains("ativo")) {
    btnClicado.classList.remove("ativo");
    containerPreview.replaceChildren();
    return;
  }

  wrapTags.querySelectorAll(".ficha-tag-link").forEach(b => b.classList.remove("ativo"));
  btnClicado.classList.add("ativo");
  containerPreview.replaceChildren();

  const busca = encontrarItemPorCodigo(codClicado, sistema);
  const card = criar("div", "encaixe-preview-card");

  if (!busca) {
    const infoVazia = criar("div", "encaixe-preview-info");
    infoVazia.appendChild(criar("p", "encaixe-preview-codigo", codClicado));
    infoVazia.appendChild(criar("p", "encaixe-preview-nome", "Não achei esse item no catálogo."));
    card.appendChild(infoVazia);
    containerPreview.appendChild(card);
    return;
  }

  const { item: alvo, aba } = busca;
  const pasta = aba === "perfis" ? "perfil" : "acessorio";
  const imgsAlvo = extrairListaImagens(alvo.imagem, imagemPadrao(alvo, pasta));
  const imgSrc = imgsAlvo.length > 0 ? imgsAlvo[0] : NO_PHOTO;

  const img = document.createElement("img");
  img.className = "encaixe-preview-img";
  img.src = imgSrc;
  img.alt = alvo.codigo;
  img.title = "Clique para ampliar a imagem";
  img.onerror = () => { img.src = NO_PHOTO; };
  img.addEventListener("click", () => {
    if (!img.src.includes("NO-PHOTO")) {
      const galeriaEncaixe = imgsAlvo.map((s, i) => ({
        src: s,
        leg: `${alvo.codigo} — ${alvo.nome}${imgsAlvo.length > 1 ? " (" + (i + 1) + "/" + imgsAlvo.length + ")" : ""}`
      }));
      abrirFoto(galeriaEncaixe, `${alvo.codigo} — ${alvo.nome}`, 0);
    }
  });
  card.appendChild(img);

  const info = criar("div", "encaixe-preview-info");
  info.appendChild(criar("p", "encaixe-preview-codigo", alvo.codigo));
  info.appendChild(criar("h4", "encaixe-preview-nome", alvo.nome || "—"));

  if (alvo.tipologia || alvo.tipo) {
    const pTip = criar("p", "encaixe-preview-detalhe");
    pTip.innerHTML = `<strong>${aba === "perfis" ? "Tipologia" : "Tipo"}:</strong> ${alvo.tipologia || alvo.tipo}`;
    info.appendChild(pTip);
  }

  const encaixeAlvo = (alvo._encaixePorSistema && alvo._encaixePorSistema[sistema]) || alvo.encaixe || alvo.aplicavel;
  if (encaixeAlvo) {
    const pEnc = criar("p", "encaixe-preview-detalhe");
    pEnc.appendChild(criar("strong", "", `${aba === "perfis" ? "Encaixes" : "Aplicável em"}: `));
    textoComQuebras(pEnc, encaixeAlvo);
    info.appendChild(pEnc);
  }

  const acoes = criar("div", "encaixe-preview-acoes");
  const btnIr = criar("button", "btn-ir-perfil");
  btnIr.type = "button";
  btnIr.innerHTML = `<i class="fa-solid fa-arrow-right"></i> Ver ficha completa de ${alvo.codigo}`;
  btnIr.addEventListener("click", () => irParaPerfilCompleto(alvo.codigo, sistema));
  acoes.appendChild(btnIr);

  info.appendChild(acoes);
  card.appendChild(info);
  containerPreview.appendChild(card);
}

const carregarImagem = src => new Promise((ok, erro) => {
  const im = new Image();
  im.onload = () => ok(im);
  im.onerror = erro;
  im.src = src;
});

// Quebra o texto em linhas que cabem na largura
function linhasDoTexto(ctx, texto, largura) {
  const linhas = [];
  String(texto || "").split("||").forEach(paragrafo => {
    let linha = "";
    paragrafo.trim().split(/\s+/).forEach(palavra => {
      const tentativa = linha ? `${linha} ${palavra}` : palavra;
      if (ctx.measureText(tentativa).width > largura && linha) {
        linhas.push(linha);
        linha = palavra;
      } else {
        linha = tentativa;
      }
    });
    if (linha) linhas.push(linha);
  });
  return linhas;
}

async function montarImagemFicha(item, desenho) {
  const perfil = abaAtiva === "perfis";
  const sistemaDaFicha = (item._sistemas || []).includes(sistemaAtivo) ? sistemaAtivo : (item._sistemas || [])[0];

  const sis = (banco.sistemas || []).find(s => s.chave === (sistemaDaFicha || item.sistema_chave)) || {};
  const cor = sis.cor && sis.chave !== "diversos" ? sis.cor : "#1f5fbf";
  const FONTE = '"Fonte Ficha", system-ui, sans-serif';
  const CODIGO = '"Fonte Codigo", "Fonte Ficha", system-ui, sans-serif';
  await Promise.all([`700 40px ${CODIGO}`, `700 24px ${FONTE}`, `400 20px ${FONTE}`].map(f => document.fonts.load(f).catch(() => {})));
  const logo = await carregarImagem("assets/img/logo.png").catch(() => null);

  const L = 1100, M = 44, largura = L - 2 * M;
  const medir = document.createElement("canvas").getContext("2d");

  const info = [];
  const juntar = lista => lista.filter(Boolean).join(" / ");
  if (perfil) {
    const perfisAplicaveis = juntar(codigosDoCampo(item, "encaixe", sistemaDaFicha));
    if (perfisAplicaveis) info.push(["Perfis aplicáveis", perfisAplicaveis]);
    const acessoriosAplicaveis = juntar(codigosDoCampo(item, "_acessorios", sistemaDaFicha));
    if (acessoriosAplicaveis) info.push(["Acessórios aplicáveis", acessoriosAplicaveis]);
    const inercia = [["Jx", item.jx], ["Jy", item.jy], ["Wx", item.wx], ["Wy", item.wy]].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("   ");
    if (inercia) info.push(["Inércia", inercia]);
    const tipologia = String(item.tipologia || "").split("|").map(t => t.trim()).filter(Boolean).join(", ");
    if (tipologia) info.push(["Tipologia", tipologia]);
    const barra = parseFloat(String(item.barra || "").replace(",", "."));
    if (barra) info.push(["Barra", `vendido somente em barra de ${barra.toLocaleString("pt-BR")} mm`]);
  } else {
    if (item.aplicavel) info.push(["Aplicável nos perfis", item.aplicavel]);
    if (item.material) info.push(["Material", item.material]);
    if (item.acabamento) info.push(["Acabamento", item.acabamento]);
    if (item.unidade_conversao || item.tipo) info.push(["Unidade", juntar([item.tipo, item.unidade_conversao])]);
  }
  if (item.observacao) info.push(["Observação", item.observacao]);

  medir.font = `400 20px ${FONTE}`;
  const blocos = info.map(([rotulo, texto]) => ({ rotulo, linhas: linhasDoTexto(medir, texto, largura - 150) }));
  medir.font = `700 26px ${FONTE}`;
  const nomeLinhas = linhasDoTexto(medir, item.nome || "", largura - 300).slice(0, 2);

  const escala = desenho ? Math.min(largura / desenho.naturalWidth, 600 / desenho.naturalHeight, 2.2) : 0;
  const altDesenho = desenho ? desenho.naturalHeight * escala : 0;
  const altCabeca = Math.max(84, 28 + nomeLinhas.length * 34);
  const altInfo = blocos.reduce((t, b) => t + b.linhas.length * 28 + 10, 0);
  const H = M + altCabeca + 56 + 30 + altDesenho + 34 + altInfo + 70;

  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = Math.ceil(H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, L, canvas.height);
  ctx.textBaseline = "middle";

  // Código e nome em caixas com a cor do sistema
  ctx.font = `700 40px ${CODIGO}`;
  const largCodigo = Math.max(200, ctx.measureText(item.codigo).width + 48);
  ctx.fillStyle = cor;
  ctx.fillRect(M, M, largCodigo, altCabeca);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(item.codigo, M + 24, M + altCabeca / 2);
  const xNome = M + largCodigo + 10;
  ctx.fillStyle = cor;
  ctx.fillRect(xNome, M, L - M - xNome, altCabeca);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 26px ${FONTE}`;
  nomeLinhas.forEach((l, i) => ctx.fillText(l, xNome + 22, M + altCabeca / 2 + (i - (nomeLinhas.length - 1) / 2) * 34));

  // Peso e sistema embaixo
  let y = M + altCabeca + 12;
  ctx.strokeStyle = cor;
  ctx.lineWidth = 2;
  ctx.strokeRect(M + 1, y, largCodigo - 2, 40);
  ctx.fillStyle = cor;
  ctx.font = `700 22px ${CODIGO}`;
  ctx.fillText(perfil ? (item.peso || "—") : (item.tipo || "Acessório"), M + 16, y + 20);
  ctx.fillStyle = "#52525b";
  ctx.font = `400 19px ${FONTE}`;
  // Sem edição no Diversos e na Linha 25
  const edicao = ["diversos", "linha_25"].includes(item.sistema_chave) ? "" : edicaoDoSistema(item.sistema_chave);
  const nomesSis = (item._sistemas || []).map(k => ((banco.sistemas || []).find(s => s.chave === k) || {}).nome || k);
  ctx.fillText([item.sistema, nomesSis.length ? `usado em ${nomesSis.join(", ")}` : "", edicao].filter(Boolean).join("  ·  "), xNome + 4, y + 20);

  // Desenho
  y += 40 + 30;
  if (desenho) {
    const w = desenho.naturalWidth * escala;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(desenho, M + (largura - w) / 2, y, w, altDesenho);
    y += altDesenho;
  }

  // Informações
  y += 20;
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(L - M, y); ctx.stroke();
  y += 24;
  blocos.forEach(b => {
    ctx.fillStyle = "#18181b";
    ctx.font = `700 18px ${FONTE}`;
    ctx.fillText(b.rotulo, M, y);
    ctx.font = `400 20px ${FONTE}`;
    ctx.fillStyle = "#27272a";
    b.linhas.forEach((l, i) => ctx.fillText(l, M + 150, y + i * 28));
    y += b.linhas.length * 28 + 10;
  });

  const yRodape = canvas.height - 34;
  if (logo) ctx.drawImage(logo, M, yRodape - 14, 28, 28);
  ctx.fillStyle = "#71717a";
  ctx.font = `400 16px ${FONTE}`;
  ctx.fillText("Consulta Perfil · Perfil Alumínio do Brasil", M + (logo ? 38 : 0), yRodape);
  ctx.textAlign = "right";
  ctx.fillText(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, L - M, yRodape);
  return canvas;
}

async function copiarFichaComoImagem(btn, item, box) {
  const original = btn.innerHTML;
  const avisar = (html) => { btn.innerHTML = html; setTimeout(() => { btn.innerHTML = original; }, 1800); };
  const img = box.querySelector("img.ficha-box-midia");
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Montando...';
  let canvas;
  try {
    const desenho = img && img.complete && img.naturalWidth && !img.src.includes("NO-PHOTO") ? img : null;
    canvas = await montarImagemFicha(item, desenho);
    const png = await new Promise(ok => canvas.toBlob(ok, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    avisar('<i class="fa-solid fa-check"></i> Ficha copiada!');
  } catch (e) {

    if (canvas) {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${item.codigo}.png`;
      a.click();
      avisar('<i class="fa-solid fa-download"></i> Baixada');
    } else {
      avisar('<i class="fa-solid fa-xmark"></i> Não deu pra montar');
    }
  }
}

function mostrarFicha(item) {
  estadoPorAba[abaAtiva].itemSelecionado = item;
  atualizarUrlItem(item);
  cor3DEscolhida = null;
  const ficha = document.getElementById("ficha-tecnica");
  ficha.replaceChildren();

  const campos = abaAtiva === "perfis" ? CAMPOS_PERFIL : CAMPOS_ACESSORIO;
  const header = criar("div", "ficha-header");
  const cabInfo = criar("div", "ficha-header-info");
  cabInfo.appendChild(criar("p", "ficha-codigo", item.codigo));
  cabInfo.appendChild(criar("h2", "ficha-nome", item.nome || "—"));

  const meta = criar("div", "ficha-meta");
  if (item.apelido && item.apelido.trim() !== "") {
    meta.appendChild(criar("p", "ficha-apelido", "Nome popular: " + item.apelido));
  }
  if (item._sistemas && item._sistemas.length) {
    const nomes = item._sistemas.map(k => ((banco.sistemas || []).find(s => s.chave === k) || {}).nome || k);
    meta.appendChild(criar("p", "ficha-apelido", "Usado nos sistemas: " + nomes.join(", ")));
  }

  const linhaBadges = criar("div", "ficha-badges-linha");
  if (item.sistema && item.sistema.trim() !== "") {
    linhaBadges.appendChild(seloSistema(item.sistema, item.sistema_chave));
  }

  const edicaoTexto = edicaoDoSistema(item.sistema_chave);
  if (edicaoTexto) {
    const badgeEdicao = criar("span", "ficha-edicao");
    const prefixoFicha = ehUltimaAlteracao(edicaoTexto) ? "" : "Catálogo ";
    badgeEdicao.innerHTML = `<i class="fa-regular fa-calendar"></i> ${prefixoFicha}${edicaoTexto}`;
    linhaBadges.appendChild(badgeEdicao);
  }

  const sub = foraDeLinha[item._codNorm || normalizar(item.codigo)];
  let acoesForaLinha = null;
  if (sub) {
    const selo = criar("span", "ficha-fora-linha");
    selo.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${ehConversao(sub) ? "Conversão de sistema" : "Fora de linha"}`;
    linhaBadges.appendChild(selo);
    acoesForaLinha = botoesSubstituto(sub, item.codigo);
  }

  meta.appendChild(linhaBadges);
  if (acoesForaLinha) meta.appendChild(acoesForaLinha);
  cabInfo.appendChild(meta);
  header.appendChild(cabInfo);

  const btnComp = criar("button", "btn-compartilhar");
  btnComp.type = "button";
  btnComp.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Compartilhar';
  btnComp.title = "Copiar link direto para este item";
  btnComp.addEventListener("click", () => copiarLinkCompartilhamento(item, btnComp));

  const btnComparar = criar("button", "btn-compartilhar btn-comparar");
  btnComparar.type = "button";
  pintarBotaoComparar(btnComparar, item);
  btnComparar.addEventListener("click", () => {
    alternarComparacao(item);
    pintarBotaoComparar(btnComparar, item);
  });

  const botoesTopo = criar("div", "ficha-header-botoes");
  botoesTopo.append(btnComp, btnComparar);
  header.appendChild(botoesTopo);

  ficha.appendChild(header);
  const trioImagens = criar("div", "ficha-imagens-trio");
  const pasta = abaAtiva === "perfis" ? "perfil" : "acessorio";
  const imgsTecnica = extrairListaImagens(item.imagem, imagemPadrao(item, pasta));
  const lista3D = extrairListaImagens(item.imagem_3d, "");
  if (item.modelo_3d && !lista3D.some(ehStl3D)) lista3D.unshift(item.modelo_3d);
  const viewerOk = typeof Viewer3D !== "undefined" && typeof THREE !== "undefined";
  const lista3DUsavel = lista3D.filter(src => tipoSlide3D(src) !== "stl" || viewerOk);
  const imgsAplicada = extrairListaImagens(item.imagem_aplicavel, "");

  const boxTecnica = criarBoxImagem(
    "imagem técnica",
    imgsTecnica,
    `Imagem técnica — ${item.codigo}`,
    "fa-regular fa-image",
    "Sem imagem técnica"
  );

  if (boxTecnica.classList.contains("com-midia")) {
    const btnCopiarImg = criar("button", "btn-copiar-imagem");
    btnCopiarImg.type = "button";
    btnCopiarImg.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar imagem';
    btnCopiarImg.title = "Copiar uma ficha com o desenho e as informações deste item";
    btnCopiarImg.addEventListener("click", (e) => {
      e.stopPropagation();
      copiarFichaComoImagem(btnCopiarImg, item, boxTecnica);
    });
    boxTecnica.appendChild(btnCopiarImg);
  }
  trioImagens.appendChild(boxTecnica);

  if (lista3DUsavel.some(src => tipoSlide3D(src) !== "img")) {
    trioImagens.appendChild(criarBoxMidia3D("imagem 3D", lista3DUsavel, `Imagem 3D — ${item.codigo}`));
  } else {
    trioImagens.appendChild(criarBoxImagem(
      "imagem 3D",
      lista3DUsavel,
      `Imagem 3D — ${item.codigo}`,
      "fa-solid fa-cube",
      "Sem imagem 3D"
    ));
  }

  if (imgsAplicada.length) {
    trioImagens.appendChild(criarBoxImagem(
      "imagem aplicada",
      imgsAplicada,
      `Imagem aplicada — ${item.codigo}`,
      "fa-solid fa-layer-group",
      "Sem imagem aplicada"
    ));
  } else {
    trioImagens.classList.add("so-duas");
  }

  ficha.appendChild(trioImagens);

  const coresItem = abaAtiva === "perfis" ? coresDoItem(item) : [];
  if (coresItem.length) ficha.appendChild(montarCores(coresItem, trioImagens));

  const graficosDoItem = abaAtiva === "perfis" ? obterGraficosDoPerfil(item) : [];
  if (graficosDoItem.length > 0) {
    const secaoGrafico = criar("div", "ficha-secao-grafico");
    const btnGrafico = criar("button", "btn-ver-grafico");
    btnGrafico.type = "button";
    const tipoBadge = graficosDoItem.every(g => g.vista) ? "gráficos" : "montagens";
    const qtdBadge = graficosDoItem.length > 1 ? ` (${graficosDoItem.length} ${tipoBadge})` : "";
    btnGrafico.innerHTML = `<i class="fa-solid fa-chart-line"></i> Visualizar Gráfico de Desempenho e Regiões de Vento (BR)${qtdBadge}`;
    btnGrafico.addEventListener("click", () => abrirModalGraficoEstrutural(item, graficosDoItem));
    secaoGrafico.appendChild(btnGrafico);
    ficha.appendChild(secaoGrafico);
  }

  ficha.appendChild(criar("hr", "ficha-divisor"));

  const grade = criar("dl", "ficha-campos");
  // Diversos: muda conforme o sistema
  const porSistema = abaAtiva === "perfis" && item._sistemas && item._sistemas.length > 0;
  let sistemaDaFicha = porSistema ? (item._sistemas.includes(sistemaAtivo) ? sistemaAtivo : item._sistemas[0]) : null;
  const redesenhos = [];

  campos.forEach(({ chave, rotulo, largo, clicavel }) => {
    const tags = clicavel ? codigosDoCampo(item, chave) : null;
    if (clicavel ? !tags.length && !porSistema : (!item[chave] || String(item[chave]).trim() === "")) return;
    if (chave === "acabamento" && coresItem.length) return;
    if (porSistema && clicavel && chave === "_acessorios" && !tags.length) return;

    const div = criar("div", "ficha-campo" + (largo ? " ficha-campo-largo" : ""));
    div.appendChild(criar("dt", "", rotulo));
    const dd = criar("dd", "");

    if (clicavel) {
      const wrapTags = criar("div", "ficha-tags");
      const containerPreview = criar("div", "encaixe-preview-container");

      const desenharTags = () => {
        wrapTags.replaceChildren();
        containerPreview.replaceChildren();
        const lista = porSistema ? codigosDoCampo(item, chave, sistemaDaFicha) : tags;
        if (!lista.length) wrapTags.appendChild(criar("span", "ficha-tags-vazio", "Nada cadastrado nesse sistema."));
        lista.forEach(cod => {
          const btnTag = criar("button", "ficha-tag-link", cod);
          btnTag.type = "button";
          btnTag.title = `Ver prévia de ${cod}`;
          btnTag.addEventListener("click", () => {
            mostrarPreviewEncaixe(cod, containerPreview, btnTag, wrapTags, sistemaDaFicha || sistemaAtivo);
          });
          wrapTags.appendChild(btnTag);
        });
      };

      if (porSistema && chave === "encaixe") {
        const escolha = criar("div", "ficha-sistemas-escolha");
        item._sistemas.forEach(k => {
          const sis = (banco.sistemas || []).find(s => s.chave === k);
          const btn = criar("button", "ficha-sistema-opcao" + (k === sistemaDaFicha ? " ativo" : ""), sis ? sis.nome : k);
          btn.type = "button";
          btn.addEventListener("click", () => {
            sistemaDaFicha = k;
            escolha.querySelectorAll(".ficha-sistema-opcao").forEach(b => b.classList.toggle("ativo", b === btn));
            redesenhos.forEach(f => f());
          });
          escolha.appendChild(btn);
        });
        dd.appendChild(escolha);
      }

      redesenhos.push(desenharTags);
      desenharTags();
      dd.appendChild(wrapTags);
      dd.appendChild(containerPreview);
    } else if (String(item[chave]).includes("||")) {
      textoComQuebras(dd, item[chave]);
    } else {
      dd.textContent = item[chave];
    }

    div.appendChild(dd);
    grade.appendChild(div);
  });

  ficha.appendChild(grade);

  const lote = abaAtiva === "perfis" ? montarPesoLote(item) : null;
  if (lote) ficha.appendChild(lote);
}

function exibirErroBancoCatalogo() {
  const container = document.getElementById("resultado-catalogo");
  const ficha = document.getElementById("ficha-tecnica");
  if (container) {
    container.replaceChildren();
    container.appendChild(criar("p", "msg-erro", MSG_ERRO_BANCO));
  }
  if (ficha) {
    ficha.replaceChildren();
    ficha.appendChild(criar("p", "msg-erro", MSG_ERRO_BANCO));
  }
}

function mostrarEstadoInicialLimpo() {
  if (erroCarregamentoBanco) {
    exibirErroBancoCatalogo();
    return;
  }
  const container = document.getElementById("resultado-catalogo");
  const ficha = document.getElementById("ficha-tecnica");
  if (container) container.replaceChildren();
  if (ficha) {
    ficha.innerHTML = '<p class="ficha-vazia">Pesquise um código ou nome ao lado, ou selecione um sistema para listar os itens.</p>';
  }
  estadoPorAba[abaAtiva].itemSelecionado = null;
  atualizarUrlItem(null);
}

function mostrarLista(itens) {
  const container = document.getElementById("resultado-catalogo");
  container.replaceChildren();

  if (itens.length === 0) {
    container.appendChild(criar("span", "status erro", "Nenhum resultado encontrado"));
    document.getElementById("ficha-tecnica").innerHTML = '<p class="ficha-vazia">Nenhum item foi encontrado para a busca.</p>';
    estadoPorAba[abaAtiva].itemSelecionado = null;
    return;
  }

  const cabecalhoLista = criar("div", "resultado-header");
  const label = itens.length === 1 ? "1 resultado" : `${itens.length} resultados`;
  cabecalhoLista.appendChild(criar("span", "status ok", label));

  const edicaoSis = sistemaAtivo !== "todos" ? edicaoDoSistema(sistemaAtivo) : "";
  if (edicaoSis) {
    const selo = criar("span", "edicao-catalogo-badge");
    selo.innerHTML = ehUltimaAlteracao(edicaoSis)
      ? `<i class="fa-solid fa-clock-rotate-left"></i> ${edicaoSis}`
      : `<i class="fa-solid fa-book-open"></i> Referência: ${edicaoSis}`;
    cabecalhoLista.appendChild(selo);
  }

  container.appendChild(cabecalhoLista);

  const listaScroll = criar("div", "catalogo-lista-scroll");
  const fragmento = document.createDocumentFragment();
  const pasta = abaAtiva === "perfis" ? "perfil" : "acessorio";

  itens.forEach((item) => {
    const linha = criar("div", "catalogo-item-lista");

    const thumb = document.createElement("img");
    thumb.className = "catalogo-item-thumb";
    thumb.alt = item.codigo;
    thumb.loading = "lazy";
    thumb.decoding = "async";
    thumb.onerror = () => { thumb.src = NO_PHOTO; };
    thumb.src = obterPrimeiraImagem(item.imagem, imagemPadrao(item, pasta));
    linha.appendChild(thumb);

    const info = criar("div", "catalogo-item-info");
    info.appendChild(criar("div", "catalogo-item-codigo", item.codigo));
    info.appendChild(criar("div", "catalogo-item-nome", item.nome || "—"));
    if (item.sistema || item.tipo) {
      const edicao = edicaoDoSistema(item.sistema_chave);
      let textoSis = item.sistema ? item.sistema + (edicao ? ` · ${edicao}` : "") : item.tipo;
      if (item._sistemas && item._sistemas.length) {
        const nomes = item._sistemas.map(k => ((banco.sistemas || []).find(s => s.chave === k) || {}).nome || k);
        textoSis = `${item.sistema} · ${nomes.slice(0, 2).join(", ")}${nomes.length > 2 ? ` +${nomes.length - 2}` : ""}`;
      }
      info.appendChild(criar("div", "catalogo-item-sistema", textoSis));
    }
    const qtdCores = abaAtiva === "perfis" ? coresDoItem(item).length : 0;
    if (qtdCores) info.appendChild(criar("span", "catalogo-item-cores", `${qtdCores} ${qtdCores > 1 ? "cores" : "cor"}`));
    linha.appendChild(info);

    linha.addEventListener("click", () => {
      listaScroll.querySelectorAll(".catalogo-item-lista.selecionado").forEach(el => el.classList.remove("selecionado"));
      linha.classList.add("selecionado");
      salvarHistorico(item.codigo, abaAtiva);
      mostrarFicha(item);
    });

    fragmento.appendChild(linha);
  });

  listaScroll.appendChild(fragmento);
  container.appendChild(listaScroll);

  const itemAtualAba = estadoPorAba[abaAtiva].itemSelecionado;
  let alvo = -1;
  if (itemAtualAba) {
    alvo = itens.findIndex(i => i.codigo === itemAtualAba.codigo && i.sistema === itemAtualAba.sistema);
    if (alvo < 0) alvo = itens.findIndex(i => i.codigo === itemAtualAba.codigo);
  } else if (itens.length === 1) {
    alvo = 0;
  }

  const linhas = listaScroll.querySelectorAll(".catalogo-item-lista");
  if (alvo >= 0 && linhas[alvo]) {
    linhas[alvo].classList.add("selecionado");
    mostrarFicha(itens[alvo]);
  } else {
    document.getElementById("ficha-tecnica").innerHTML = '<p class="ficha-vazia">Selecione um item na lista ao lado para visualizar a ficha técnica completa.</p>';
  }
}

function executarFiltro() {
  if (erroCarregamentoBanco) {
    exibirErroBancoCatalogo();
    return;
  }
  const estadoAtual = estadoPorAba[abaAtiva];
  if (!estadoAtual.jaInteragiu) {
    mostrarEstadoInicialLimpo();
    return;
  }

  const campoBusca = document.getElementById("busca-catalogo");
  const termo = campoBusca ? campoBusca.value.trim() : "";
  estadoAtual.termo = termo;

  const listaBase = banco[abaAtiva] || [];
  let filtrados = listaBase;

  if (sistemaAtivo !== "todos") {
    filtrados = filtrados.filter(item => itemPertenceAoSistema(item, sistemaAtivo));
  }

  if (termo) {
    const codExato = normalizar(termo);
    const exatos = filtrados.filter(i => i._codNorm === codExato);

    if (exatos.length > 0) {
      filtrados = exatos;
      // Mesmo código em 2 sistemas
      if (!exatos.includes(estadoAtual.itemSelecionado)) estadoAtual.itemSelecionado = exatos[0];
      salvarHistorico(exatos[0].codigo, abaAtiva);
    } else {
      filtrados = filtrados.filter(item => itemBateComTermo(item, termo));
    }
  }

  mostrarLista(filtrados);

  const aviso = termo ? avisoForaDeLinha(termo) : null;
  if (aviso) document.getElementById("resultado-catalogo").prepend(aviso);
}

function marcarSistemaAtivo(chave) {
  sistemaAtivo = chave;
  document.querySelectorAll(".sistema-btn").forEach(b => {
    b.classList.toggle("sistema-btn-ativo", b.dataset.sistema === chave);
  });
  atualizarPlaceholder();
}

function atualizarPlaceholder() {
  const campo = document.getElementById("busca-catalogo");
  if (!campo) return;
  let exemplo = (EXEMPLOS_BUSCA[sistemaAtivo] || {})[abaAtiva];
  if (!exemplo) {
    const lista = (banco[abaAtiva] || []).filter(i => itemPertenceAoSistema(i, sistemaAtivo));
    exemplo = lista.length ? lista[Math.floor(Math.random() * lista.length)].codigo : "";
  }
  campo.placeholder = exemplo ? `Ex: ${exemplo}` : "Nome ou código";
}

// Troca de sistema
function limparBuscaDoCatalogo() {
  const campo = document.getElementById("busca-catalogo");
  const limpar = document.querySelector("#form-catalogo .btn-limpar");
  Object.values(estadoPorAba).forEach(e => { e.termo = ""; e.itemSelecionado = null; e.jaInteragiu = true; });
  if (campo) campo.value = "";
  if (limpar) limpar.hidden = true;
  atualizarUrlItem(null);
}

function construirFiltroSistemas() {
  const container = document.getElementById("filtro-sistemas");
  if (!container) return;

  const comItens = new Set([...banco.perfis, ...banco.acessorios].flatMap(i => [i.sistema_chave, ...(i._sistemas || [])]));
  const opcoes = [{ chave: "todos", nome: "Todos" }, ...(banco.sistemas || [])];
  // Cores de todos os sistemas no Todos
  const coresTodos = [...new Set((banco.sistemas || []).map(s => s.cor).filter(c => c && c !== "#6B7280"))];

  container.replaceChildren();
  opcoes.forEach(sis => {
    const ativo = sis.chave === "todos" || comItens.has(sis.chave);
    const btn = criar("button", "sistema-btn" + (ativo ? "" : " sistema-btn-desativado"), sis.nome);
    btn.type = "button";
    btn.dataset.sistema = sis.chave;
    if (sis.cor) btn.style.setProperty("--cor-sistema", sis.cor);
    if (sis.chave === "todos" && coresTodos.length) {
      btn.classList.add("sistema-btn-todos");
      btn.style.setProperty("--cores-todos", coresTodos.join(", "));
    }

    if (!ativo) {
      btn.title = "Sistema em desenvolvimento";
      btn.setAttribute("aria-disabled", "true");
    } else {
      btn.addEventListener("click", () => {
        limparBuscaDoCatalogo();
        marcarSistemaAtivo(sis.chave);
        renderizarHistorico();
        executarFiltro();
      });
    }
    container.appendChild(btn);
  });
  marcarSistemaAtivo(sistemaAtivo);
}

function configurarAbas() {
  const campo = document.getElementById("busca-catalogo");
  const limpar = document.querySelector("#form-catalogo .btn-limpar");

  document.querySelectorAll(".catalogo-aba").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.aba === abaAtiva) return;

      if (campo) {
        estadoPorAba[abaAtiva].termo = campo.value;
      }

      document.querySelectorAll(".catalogo-aba").forEach(b => b.classList.remove("catalogo-aba-ativa"));
      btn.classList.add("catalogo-aba-ativa");
      abaAtiva = btn.dataset.aba;

      const novoEstado = estadoPorAba[abaAtiva];
      if (campo) {
        campo.value = novoEstado.termo || "";
      }
      atualizarPlaceholder();
      if (limpar) {
        limpar.hidden = !(novoEstado.termo && novoEstado.termo.trim() !== "");
      }

      renderizarHistorico();
      executarFiltro();
    });
  });
}

function configurarForm() {
  const form = document.getElementById("form-catalogo");
  const campo = document.getElementById("busca-catalogo");
  const limpar = form.querySelector(".btn-limpar");
  const btnCamera = document.getElementById("btn-camera-ia");
  let timerDebounce = null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearTimeout(timerDebounce);
    estadoPorAba[abaAtiva].jaInteragiu = true;
    const digitado = campo.value.trim();
    estadoPorAba[abaAtiva].termo = digitado;
    if (limpar) limpar.hidden = !digitado;
    if (digitado && !erroCarregamentoBanco) {
      salvarHistorico(digitado.toUpperCase(), abaAtiva);
    }
    executarFiltro();
  });

  campo.addEventListener("input", () => {
    estadoPorAba[abaAtiva].jaInteragiu = true;
    estadoPorAba[abaAtiva].termo = campo.value;
    if (limpar) limpar.hidden = !campo.value.trim();
    if (!campo.value.trim()) {
      estadoPorAba[abaAtiva].itemSelecionado = null;
    }
    clearTimeout(timerDebounce);
    timerDebounce = setTimeout(() => {
      executarFiltro();
    }, 120);
  });

  if (limpar) {
    limpar.addEventListener("click", () => {
      clearTimeout(timerDebounce);
      estadoPorAba[abaAtiva].jaInteragiu = true;
      estadoPorAba[abaAtiva].termo = "";
      estadoPorAba[abaAtiva].itemSelecionado = null;
      campo.value = "";
      limpar.hidden = true;
      executarFiltro();
      campo.focus();
    });
  }

  if (btnCamera) btnCamera.addEventListener("click", abrirBuscaVisual);

}

// TODO: mandar a foto pra API
function abrirBuscaVisual() {
  const modal = criar("div", "foto-modal busca-foto-modal");
  modal.setAttribute("aria-label", "Busca Visual");
  const caixa = criar("div", "busca-foto-caixa");

  const topo = criar("div", "busca-foto-topo");
  topo.innerHTML = '<h3><i class="fa-solid fa-camera"></i> Busca Visual</h3>';
  const btnFechar = botaoIcone("busca-foto-fechar", "fa-solid fa-xmark", "Fechar");
  topo.appendChild(btnFechar);

  const area = criar("label", "busca-foto-area");
  area.innerHTML = '<i class="fa-regular fa-image"></i><strong>Arrasta a foto aqui ou clica pra escolher</strong>' +
    '<span>Foto do corte do perfil, de frente e com fundo claro, fica melhor.</span>';
  const inputArquivo = document.createElement("input");
  inputArquivo.type = "file";
  inputArquivo.accept = "image/*";
  inputArquivo.hidden = true;
  area.appendChild(inputArquivo);

  const inputCamera = document.createElement("input");
  inputCamera.type = "file";
  inputCamera.accept = "image/*";
  inputCamera.capture = "environment";
  inputCamera.hidden = true;

  const acoes = criar("div", "busca-foto-acoes");
  const btnCamera = criar("button", "btn btn-secundario");
  btnCamera.type = "button";
  btnCamera.innerHTML = '<i class="fa-solid fa-camera"></i> Tirar foto';
  btnCamera.addEventListener("click", () => inputCamera.click());
  const btnFixar = criar("button", "btn btn-principal");
  btnFixar.type = "button";
  btnFixar.innerHTML = '<i class="fa-solid fa-thumbtack"></i> Fixar do lado da lista';
  btnFixar.disabled = true;
  acoes.append(btnCamera, btnFixar, inputCamera);

  const aviso = criar("p", "busca-foto-aviso");
  aviso.innerHTML = '<i class="fa-solid fa-circle-info"></i> A Busca Visual ainda está sendo feita. ' +
    'Por enquanto dá pra fixar a foto do lado da lista e ir comparando com os desenhos.';

  caixa.append(topo, area, acoes, aviso);
  modal.appendChild(caixa);

  let fotoAtual = "";
  const mostrarPrevia = (arquivo) => {
    if (!arquivo || !arquivo.type.startsWith("image/")) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      fotoAtual = leitor.result;
      area.classList.add("com-foto");
      area.replaceChildren(inputArquivo);
      const img = document.createElement("img");
      img.src = fotoAtual;
      img.alt = "Foto escolhida";
      area.append(img, criar("span", "busca-foto-trocar", "Clica pra trocar a foto"));
      btnFixar.disabled = false;
    };
    leitor.readAsDataURL(arquivo);
  };

  inputArquivo.addEventListener("change", () => mostrarPrevia(inputArquivo.files[0]));
  inputCamera.addEventListener("change", () => mostrarPrevia(inputCamera.files[0]));
  area.addEventListener("dragover", (e) => { e.preventDefault(); area.classList.add("arrastando"); });
  area.addEventListener("dragleave", () => area.classList.remove("arrastando"));
  area.addEventListener("drop", (e) => {
    e.preventDefault();
    area.classList.remove("arrastando");
    mostrarPrevia(e.dataTransfer.files[0]);
  });

  const fechar = abrirModal(modal, "foto-aberta");
  btnFechar.addEventListener("click", fechar);
  btnFixar.addEventListener("click", () => {
    fixarFoto(fotoAtual);
    fechar();
  });
}

function fixarFoto(src) {
  document.getElementById("foto-fixada")?.remove();
  if (!src) return;
  const card = criar("div", "foto-fixada");
  card.id = "foto-fixada";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Sua foto";
  img.addEventListener("click", () => abrirFoto(src, "Sua foto"));
  const tirar = botaoIcone("foto-fixada-tirar", "fa-solid fa-xmark", "Tirar foto fixada");
  tirar.addEventListener("click", () => card.remove());
  card.append(img, criar("span", "", "Sua foto"), tirar);
  const resultado = document.getElementById("resultado-catalogo");
  resultado.parentNode.insertBefore(card, resultado);
}

// Pesquisa geral
const NUMEROS = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, oito: 8 };
const PALAVRAS_VAZIAS = new Set(["como", "fazer", "faco", "montar", "quero", "preciso", "uma", "um", "de", "da", "do", "das", "dos",
  "para", "pra", "com", "e", "o", "a", "os", "as", "na", "no", "em", "perfil", "perfis", "sistema", "linha", "qual", "quais",
  "usar", "que", "folha", "folhas", "tipo", "tem"]);
const DETALHES = ["bandeira", "peitoril", "persiana", "veneziana", "minimalista", "canto", "baguete", "movel", "integrada", "reforc"];

function textoPesquisa(t) {
  let s = (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/maxim[\s-]?ar|basculante/g, "maximar").replace(/guarda[\s-]?corpos?/g, "guardacorpo");
  Object.entries(NUMEROS).forEach(([p, n]) => { s = s.replace(new RegExp(`\\b${p}\\b`, "g"), String(n)); });
  return s;
}

function entenderPesquisa(texto) {
  const t = textoPesquisa(texto);
  const folhas = (t.match(/(\d+)\s*folhas?/) || [])[1];
  const sistemas = (banco.sistemas || []).filter(s => {
    const nome = textoPesquisa(s.nome).replace(/\s*2\.5$/, "");
    return new RegExp(`\\b${nome}\\b`).test(t);
  });
  const nomesSistemas = sistemas.flatMap(s => textoPesquisa(s.nome).split(/\s+/));
  const palavras = t.replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter(p => p && !PALAVRAS_VAZIAS.has(p) && !/^\d+$/.test(p) && !nomesSistemas.includes(p))
    .map(p => p.replace(/s$/, ""));
  return { folhas: folhas ? Number(folhas) : null, sistemas: sistemas.map(s => s.chave), palavras };
}

function pontuarTipologia(tip, p) {
  if (p.sistemas.length && !p.sistemas.includes(tip.sistema_chave)) return 0;
  const nome = tip._norm || (tip._norm = textoPesquisa(`${tip.tipologia} ${tip.grupo || ""}`));
  const folhasTip = (nome.match(/(\d+)\s*folhas?/) || [])[1];
  if (p.folhas && Number(folhasTip) !== p.folhas) return 0;

  let pontos = 0, bateu = false, palavras = 0;
  p.palavras.forEach(w => {
    if (nome.includes(w)) { pontos += 3; bateu = true; palavras++; }
  });
  if (p.folhas) { pontos += 5; bateu = true; }
  if (!p.palavras.length && !p.folhas && p.sistemas.length) { pontos += 1; bateu = true; }
  if (!bateu) return { pontos: 0, palavras: 0 };
  // Versão simples primeiro
  DETALHES.forEach(d => { if (nome.includes(d) && !p.palavras.some(w => d.startsWith(w) || w.startsWith(d))) pontos -= 1; });
  return { pontos: Math.max(pontos, 0.5), palavras };
}

function listaCodigos(texto) {
  return String(texto || "").split(/[\/,]+/).map(c => c.trim()).filter(Boolean);
}

function miniaturaPerfil(cod, sistemaChave) {
  const achado = encontrarItemPorCodigo(cod, sistemaChave);
  const item = achado ? achado.item : null;
  const btn = criar("button", "tipologia-perfil");
  btn.type = "button";
  btn.title = item ? `Abrir ficha de ${item.codigo}` : `${cod} ainda não está no catálogo`;

  const foto = criar("span", "tipologia-perfil-foto");
  const src = item ? obterPrimeiraImagem(item.imagem, imagemPadrao(item, achado.aba === "perfis" ? "perfil" : "acessorio")) : "";
  if (src && !src.includes("NO-PHOTO")) {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = cod;
    img.src = src;
    img.onerror = () => {
      foto.classList.add("sem-foto");
      foto.innerHTML = '<i class="fa-regular fa-image"></i>';
    };
    foto.appendChild(img);
  } else {
    foto.classList.add("sem-foto");
    foto.innerHTML = '<i class="fa-regular fa-image"></i>';
  }

  btn.append(foto, criar("strong", "", item ? item.codigo : cod), criar("span", "tipologia-perfil-nome", item ? item.nome || "" : "Fora do catálogo"));
  if (item && item.peso) btn.appendChild(criar("small", "", item.peso));
  if (!item) btn.disabled = true;
  btn.addEventListener("click", () => {
    irParaPerfilCompleto(cod, sistemaChave || sistemaAtivo, true);
    document.getElementById("ficha-tecnica").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return btn;
}

function cardTipologia(tip, aberto, rotuloQtd = "perfis") {
  const card = criar("article", "tipologia-card" + (aberto ? " aberto" : ""));
  card.dataset.sistema = tip.sistema_chave || "";
  const codigos = listaCodigos(tip.perfis);

  const topo = criar("button", "tipologia-card-topo");
  topo.type = "button";
  topo.setAttribute("aria-expanded", aberto ? "true" : "false");
  const titulo = criar("span", "tipologia-card-titulo");
  titulo.append(criar("i", "fa-solid fa-chevron-right tipologia-card-seta"), criar("span", "", tip.tipologia));
  const lado = criar("span", "tipologia-card-lado");
  lado.append(criar("span", "tipologia-card-qtd", `${codigos.length} ${rotuloQtd}`), seloSistema(tip.sistema, tip.sistema_chave));
  topo.append(titulo, lado);
  topo.addEventListener("click", () => {
    const abre = !card.classList.contains("aberto");
    card.classList.toggle("aberto", abre);
    topo.setAttribute("aria-expanded", abre ? "true" : "false");
  });

  const corpo = criar("div", "tipologia-card-corpo");
  const grade = criar("div", "tipologia-perfis");
  codigos.forEach(cod => grade.appendChild(miniaturaPerfil(cod, tip.sistema_chave)));
  corpo.appendChild(grade);

  const comps = listaCodigos(tip.componentes);
  if (comps.length) {
    const linha = criar("div", "ficha-tags");
    comps.forEach(c => {
      const b = criar("button", "ficha-tag-link", c);
      b.type = "button";
      b.addEventListener("click", () => irParaPerfilCompleto(c, tip.sistema_chave, true));
      linha.appendChild(b);
    });
    corpo.append(criar("span", "tipologia-card-sub", "Componentes"), linha);
  }

  card.append(topo, corpo);
  return card;
}

function pesquisarGeral(texto, tipologiaExata = "") {
  const caixa = document.getElementById("pesquisa-geral-resultado");
  texto = texto.trim();
  if (!texto) { caixa.hidden = true; return; }

  const p = entenderPesquisa(texto);
  let achadas;
  if (tipologiaExata) {
    achadas = (banco.tipologias || []).filter(t => t.tipologia.trim() === tipologiaExata);
  } else {
    const notas = (banco.tipologias || [])
      .map(t => ({ t, ...pontuarTipologia(t, p) }))
      .filter(x => x.pontos > 0);
    // Fica com quem bateu mais palavras
    const melhor = Math.max(0, ...notas.map(x => x.palavras));
    achadas = notas
      .filter(x => x.palavras === melhor)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 8)
      .map(x => x.t);
  }

  caixa.replaceChildren();
  const topo = criar("div", "pesquisa-geral-topo");
  const resumo = criar("div", "pesquisa-geral-resumo");
  resumo.appendChild(criar("strong", "", achadas.length
    ? `${achadas.length} ${achadas.length > 1 ? "tipologias" : "tipologia"} pra "${texto}"`
    : `Não achei tipologia pra "${texto}"`));
  if (achadas.length) resumo.appendChild(criar("span", "", "Clica num perfil pra abrir a ficha ao lado"));
  const fechar = botaoIcone("pesquisa-geral-fechar", "fa-solid fa-xmark", "Fechar resultado");
  fechar.addEventListener("click", () => { caixa.hidden = true; });
  topo.append(resumo, fechar);
  caixa.appendChild(topo);

  const lista = criar("div", "tipologia-cards");
  achadas.forEach((t, i) => lista.appendChild(cardTipologia(t, i === 0)));

  const sistemas = [...new Map(achadas.map(t => [t.sistema_chave, t.sistema])).entries()];
  if (sistemas.length > 1) {
    const filtros = criar("div", "pesquisa-geral-filtros");
    const opcoes = [["todos", `Todos (${achadas.length})`],
      ...sistemas.map(([k, nome]) => [k, `${nome} (${achadas.filter(t => t.sistema_chave === k).length})`])];
    opcoes.forEach(([chave, rotulo], i) => {
      const b = criar("button", "pesquisa-geral-filtro" + (i === 0 ? " ativo" : ""), rotulo);
      b.type = "button";
      b.addEventListener("click", () => {
        filtros.querySelectorAll(".pesquisa-geral-filtro").forEach(x => x.classList.toggle("ativo", x === b));
        lista.querySelectorAll(".tipologia-card").forEach(c => { c.hidden = chave !== "todos" && c.dataset.sistema !== chave; });
        const primeiro = [...lista.querySelectorAll(".tipologia-card")].find(c => !c.hidden);
        if (primeiro && !lista.querySelector(".tipologia-card.aberto:not([hidden])")) primeiro.querySelector(".tipologia-card-topo").click();
      });
      filtros.appendChild(b);
    });
    caixa.appendChild(filtros);
  }
  if (achadas.length) caixa.appendChild(lista);

  // Pouca tipologia: mostra os itens também
  if (!tipologiaExata && achadas.length < 2 && p.palavras.length) {
    const soltos = [...banco.perfis, ...banco.acessorios]
      .filter(i => p.palavras.every(w => (i._buscaIndex || "").includes(w)))
      .slice(0, 12);
    if (soltos.length) {
      const extra = criar("div", "tipologia-cards");
      extra.appendChild(cardTipologia({ tipologia: "Itens do catálogo com essas palavras", sistema: "Catálogo",
        perfis: soltos.map(i => i.codigo).join(" / ") }, !achadas.length, "itens"));
      caixa.appendChild(extra);
    } else if (!achadas.length) {
      caixa.appendChild(criar("p", "pesquisa-geral-vazio", "Tenta de outro jeito, tipo: janela de correr 2 folhas, porta de giro, maxim-ar chroma."));
    }
  }
  caixa.hidden = false;
}

function configurarPesquisaGeral() {
  const form = document.getElementById("form-pesquisa-geral");
  const campo = document.getElementById("pesquisa-geral");
  if (!form || !campo) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    pesquisarGeral(campo.value);
  });

  // Sugestões
  const sugestoes = document.getElementById("pesquisa-geral-sugestoes");
  const contagem = {};
  (banco.tipologias || []).forEach(t => {
    const k = t.tipologia.trim();
    if (/\d+\s*folhas?|giro|maxim|guarda|pivot/i.test(k)) contagem[k] = (contagem[k] || 0) + 1;
  });
  Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([nome]) => {
    const chip = criar("button", "pesquisa-geral-chip", nome);
    chip.type = "button";
    chip.addEventListener("click", () => {
      campo.value = nome;
      pesquisarGeral(nome);
    });
    sugestoes.appendChild(chip);
  });

  montarMenuTipologias(campo);
}

// Menu de tipologias
function montarMenuTipologias(campo) {
  const caixa = document.getElementById("filtro-tipologia");
  if (!caixa) return;
  const botao = caixa.querySelector(".filtro-tipologia-botao");
  const lista = caixa.querySelector(".filtro-tipologia-lista");
  const nomes = [...new Set((banco.tipologias || []).map(t => t.tipologia.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const fechar = () => { lista.hidden = true; botao.setAttribute("aria-expanded", "false"); };
  const grupos = [["Janelas", n => /^janela/i.test(n)], ["Portas", n => /^porta/i.test(n)], ["Outras", () => true]];
  const usados = new Set();
  grupos.forEach(([titulo, bate]) => {
    const doGrupo = nomes.filter(n => !usados.has(n) && bate(n));
    if (!doGrupo.length) return;
    lista.appendChild(criar("span", "filtro-tipologia-grupo", titulo));
    doGrupo.forEach(nome => {
      usados.add(nome);
      const qtd = (banco.tipologias || []).filter(t => t.tipologia.trim() === nome).length;
      const item = criar("button", "filtro-tipologia-item");
      item.type = "button";
      item.append(criar("span", "", nome), criar("small", "", qtd > 1 ? `${qtd} sistemas` : ""));
      item.addEventListener("click", () => {
        campo.value = nome;
        fechar();
        pesquisarGeral(nome, nome);
      });
      lista.appendChild(item);
    });
  });

  botao.addEventListener("click", () => {
    const abrir = lista.hidden;
    lista.hidden = !abrir;
    botao.setAttribute("aria-expanded", abrir ? "true" : "false");
  });
  document.addEventListener("click", e => { if (!caixa.contains(e.target)) fechar(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });
}

function carregarForaDeLinha() {
  carregarBanco("/api/substituicoes").then(dados => {
    [...(dados.perfis || []), ...(dados.acessorios || [])].forEach(s => {
      const sub = (s.substituicao || "").trim();
      if (!sub || sub === "-") return;
      s.codigo.split("+").forEach(c => { if (normalizar(c) !== normalizar(sub)) foraDeLinha[normalizar(c)] = s; });
    });
    if (estadoPorAba[abaAtiva].jaInteragiu) executarFiltro();
  }).catch(() => {});
}

function ehConversao(s) {
  return /->/.test(s.sistema || "");
}

function avisoForaDeLinha(termo) {
  const s = foraDeLinha[normalizar(termo)];
  if (!s) return null;

  const caixa = criar("div", "aviso-fora-linha");
  caixa.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
  const texto = criar("div", "aviso-fora-linha-texto");
  texto.appendChild(criar("strong", "", ehConversao(s) ? `${s.codigo} (${s.sistema})` : `${s.codigo} saiu de linha`));

  texto.appendChild(botoesSubstituto(s, s.codigo));
  if (s.observacao) texto.appendChild(criar("small", "", s.observacao.split("||").map(t => t.trim()).join(" · ")));

  caixa.appendChild(texto);
  return caixa;
}

// Botão do substituto
function botoesSubstituto(s, codigo) {
  const linha = criar("div", "fora-linha-acoes");
  const noCatalogo = cod => [...banco.perfis, ...banco.acessorios].some(i => normalizar(i.codigo) === normalizar(cod));
  s.substituicao.split("+").map(c => c.trim()).filter(noCatalogo).forEach(cod => {
    const btn = criar("button", "btn-ir-substituto");
    btn.type = "button";
    btn.innerHTML = `<i class="fa-solid fa-arrow-right"></i> ${ehConversao(s) ? "Ver" : "Ir pro"} ${cod}`;
    btn.title = `Abrir a ficha do ${cod}`;
    btn.addEventListener("click", () => irParaPerfilCompleto(cod, sistemaAtivo, true));
    linha.appendChild(btn);
  });
  const link = criar("a", "link-substituicao");
  link.href = `${linkPagina("")}?codigo=${encodeURIComponent(codigo)}`;
  link.innerHTML = '<i class="fa-solid fa-right-left"></i> Ver na Substituição';
  linha.appendChild(link);
  return linha;
}

// Peso do lote
function montarPesoLote(item) {
  const kgPorMetro = parseFloat(String(item.peso || "").replace(",", "."));
  if (!kgPorMetro) return null;

  const caixa = criar("div", "peso-lote");
  caixa.appendChild(criar("span", "ficha-cores-rotulo", "Peso do lote"));
  const linha = criar("div", "peso-lote-linha");

  const campo = (rotulo, valor, passo) => {
    const label = criar("label", "peso-lote-campo");
    label.appendChild(criar("span", "", rotulo));
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = passo;
    input.value = valor;
    label.appendChild(input);
    linha.appendChild(label);
    return input;
  };
  // Barra do Notion (mm) ou 6 m
  const barraMm = parseFloat(String(item.barra || "").replace(",", "."));
  const barras = campo("Barras", 1, "1");
  const metros = campo("Metros por barra", barraMm ? barraMm / 1000 : 6, "0.1");
  if (barraMm) caixa.appendChild(criar("span", "peso-lote-aviso", `Vendido somente em barra de ${barraMm.toLocaleString("pt-BR")} mm`));
  const total = criar("strong", "peso-lote-total");
  linha.appendChild(total);

  const calcular = () => {
    const kg = kgPorMetro * (parseFloat(barras.value) || 0) * (parseFloat(metros.value) || 0);
    total.textContent = `${kg.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg`;
  };
  barras.addEventListener("input", calcular);
  metros.addEventListener("input", calcular);
  calcular();

  caixa.appendChild(linha);
  return caixa;
}

// Comparar lado a lado (até 3)
const mesmoItem = (a, b) => a.codigo === b.codigo && a.sistema_chave === b.sistema_chave;

function alternarComparacao(item) {
  const i = comparando.findIndex(x => mesmoItem(x, item));
  if (i >= 0) {
    comparando.splice(i, 1);
  } else {
    if (comparando.length >= 3) comparando.shift();
    comparando.push(item);
  }
  atualizarBarraComparar();
}

function pintarBotaoComparar(btn, item) {
  const dentro = comparando.some(x => mesmoItem(x, item));
  btn.classList.toggle("ativo", dentro);
  btn.innerHTML = dentro
    ? '<i class="fa-solid fa-check"></i> Comparando'
    : '<i class="fa-solid fa-table-columns"></i> Comparar';
}

function atualizarBarraComparar() {
  let barra = document.getElementById("barra-comparar");
  if (!comparando.length) {
    if (barra) barra.remove();
    return;
  }
  if (!barra) {
    barra = criar("div", "barra-comparar");
    barra.id = "barra-comparar";
    document.body.appendChild(barra);
  }
  barra.replaceChildren(criar("span", "barra-comparar-titulo", "Comparar:"));

  comparando.forEach(it => {
    const chip = criar("span", "barra-comparar-item", it.codigo);
    const tirar = botaoIcone("barra-comparar-tirar", "fa-solid fa-xmark", `Tirar ${it.codigo}`);
    tirar.addEventListener("click", () => {
      alternarComparacao(it);
      const btn = document.querySelector(".btn-comparar");
      const atual = estadoPorAba[abaAtiva].itemSelecionado;
      if (btn && atual) pintarBotaoComparar(btn, atual);
    });
    chip.appendChild(tirar);
    barra.appendChild(chip);
  });

  const ver = criar("button", "btn btn-principal");
  ver.type = "button";
  ver.innerHTML = '<i class="fa-solid fa-table-columns"></i> Ver lado a lado';
  ver.disabled = comparando.length < 2;
  ver.title = comparando.length < 2 ? "Escolhe pelo menos 2 itens" : "";
  ver.addEventListener("click", abrirComparacao);

  const limpar = criar("button", "btn btn-secundario", "Limpar");
  limpar.type = "button";
  limpar.addEventListener("click", () => {
    comparando = [];
    atualizarBarraComparar();
    const btn = document.querySelector(".btn-comparar");
    const atual = estadoPorAba[abaAtiva].itemSelecionado;
    if (btn && atual) pintarBotaoComparar(btn, atual);
  });
  barra.append(ver, limpar);
}

function abrirComparacao() {
  const modal = criar("div", "foto-modal comparar-modal");
  modal.setAttribute("aria-label", "Comparação lado a lado");
  const caixa = criar("div", "comparar-caixa");

  const topo = criar("div", "busca-foto-topo");
  topo.innerHTML = '<h3><i class="fa-solid fa-table-columns"></i> Lado a lado</h3>';
  const btnFechar = botaoIcone("busca-foto-fechar", "fa-solid fa-xmark", "Fechar");
  topo.appendChild(btnFechar);

  const ehAcessorio = it => "aplicavel" in it;
  const linhas = [
    ["Nome", it => it.nome],
    ["Sistema", it => it.sistema],
    ["Peso", it => it.peso],
    ["Tipologia", it => it.tipologia || it.tipo],
    ["Encaixe / Aplicável", it => it.encaixe || it.aplicavel],
    ["Jx", it => it.jx],
    ["Jy", it => it.jy],
    ["Wx", it => it.wx],
    ["Wy", it => it.wy],
    ["Material", it => it.material],
    ["Unidade", it => it.unidade_conversao],
    ["Cores / Acabamento", it => it.acabamento],
    ["Observação", it => it.observacao],
  ];

  const tabela = document.createElement("table");
  tabela.className = "comparar-tabela";
  const cab = document.createElement("tr");
  cab.appendChild(document.createElement("th"));
  comparando.forEach(it => {
    const th = document.createElement("th");
    const img = document.createElement("img");
    img.src = obterPrimeiraImagem(it.imagem, imagemPadrao(it, ehAcessorio(it) ? "acessorio" : "perfil"));
    img.alt = it.codigo;
    img.onerror = () => { img.src = NO_PHOTO; };
    th.append(img, criar("div", "comparar-codigo", it.codigo));
    cab.appendChild(th);
  });
  tabela.appendChild(cab);

  linhas.forEach(([rotulo, pega]) => {
    const valores = comparando.map(it => String(pega(it) || "").trim());
    if (valores.every(v => !v)) return;
    const tr = document.createElement("tr");
    if (new Set(valores).size > 1) tr.className = "diferente";
    tr.appendChild(criar("td", "comparar-rotulo", rotulo));
    comparando.forEach((it, i) => {
      const td = criar("td", "");
      const cores = rotulo.startsWith("Cores") ? coresDoItem(it) : [];
      if (cores.length) {
        cores.forEach(c => {
          const bolinha = criar("span", "cor-bolinha");
          bolinha.style.background = c.hex;
          bolinha.title = `${c.nome} (${c.codigo})`;
          td.appendChild(bolinha);
        });
      } else {
        td.textContent = valores[i] ? valores[i].split("||").join(" · ") : "—";
      }
      tr.appendChild(td);
    });
    tabela.appendChild(tr);
  });

  const rolagem = criar("div", "comparar-rolagem");
  rolagem.appendChild(tabela);
  caixa.append(topo, rolagem, criar("small", "ficha-cores-dica", "As linhas destacadas são onde os itens são diferentes."));
  modal.appendChild(caixa);

  const fechar = abrirModal(modal, "foto-aberta");
  btnFechar.addEventListener("click", fechar);
}

async function iniciar() {
  iniciarTema();
  iniciarRelogio();

  try {
    banco = await carregarBanco("/api/catalogo");
    indexarBancoCatalogo();
    carregarForaDeLinha();
  } catch {
    erroCarregamentoBanco = true;
  }

  construirFiltroSistemas();
  configurarAbas();
  configurarForm();
  configurarPesquisaGeral();
  renderizarHistorico();

  if (erroCarregamentoBanco) {
    exibirErroBancoCatalogo();
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const codParam = params.get("codigo");
  const sisParam = params.get("sistema");
  const abaParam = params.get("aba");

  if (abaParam && (abaParam === "perfis" || abaParam === "acessorios")) {
    abaAtiva = abaParam;
    document.querySelectorAll(".catalogo-aba").forEach(b => b.classList.remove("catalogo-aba-ativa"));
    document.querySelector(`.catalogo-aba[data-aba="${abaAtiva}"]`)?.classList.add("catalogo-aba-ativa");
  }

  const sisUrl = sisParam ? acharSistema(sisParam) : null;
  if (sisUrl) marcarSistemaAtivo(sisUrl.chave);

  if (codParam) {
    const busca = encontrarItemPorCodigo(codParam, sistemaAtivo);
    if (busca && !abaParam && busca.aba !== abaAtiva) {
      document.querySelectorAll(".catalogo-aba").forEach(b => b.classList.remove("catalogo-aba-ativa"));
      document.querySelector(`.catalogo-aba[data-aba="${busca.aba}"]`)?.classList.add("catalogo-aba-ativa");
      abaAtiva = busca.aba;
    }
    estadoPorAba[abaAtiva].jaInteragiu = true;
    estadoPorAba[abaAtiva].termo = codParam;
    estadoPorAba[abaAtiva].itemSelecionado = busca ? busca.item : null;

    const campo = document.getElementById("busca-catalogo");
    const limpar = document.querySelector("#form-catalogo .btn-limpar");
    if (campo) campo.value = codParam;
    if (limpar) limpar.hidden = false;
    renderizarHistorico();
    executarFiltro();
  } else {
    mostrarEstadoInicialLimpo();
  }
}

iniciar();