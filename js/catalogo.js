const NO_PHOTO = "assets/img/catalog/NO-PHOTO.webp";
const MAPA_ISOPLETAS_IMG = "assets/img/catalog/ISOPLETAS.webp";
const HISTORICO_KEY_PERFIS = "historico_catalogo_perfis";
const HISTORICO_KEY_ACESSORIOS = "historico_catalogo_acessorios";
const HISTORICO_MAX = 5;

// EDIÇÃO DE CADA SISTEMA NO CATÁLOGO

const edicao_chroma            = 'Ed. 11 · Dezembro/2025';
const edicao_ecoline           = 'Ed. 7 · Dezembro/2025';
const edicao_ecostick          = 'Ed. 1 · Outubro/2026';
const edicao_diversos          = 'Última alteração: Outubro/2026';
const edicao_grandline         = 'Ed. 1 · Outubro/2026';
const edicao_ecogrid           = 'Ed. 1 · Outubro/2026';
const edicao_tabelados         = 'Ed. 1 · Outubro/2026';
const edicao_sophia            = 'Ed. 1 · Outubro/2026';
const edicao_minimalframe      = 'Ed. 1 · Outubro/2026';
const edicao_wallframe         = 'Ed. 1 · Outubro/2026';
const edicao_slidinglass       = 'Ed. 1 · Outubro/2026';
const edicao_fachada_ventilada = 'Ed. 1 · Outubro/2026';
const edicao_artus             = 'Ed. 1 · Outubro/2026';
const edicao_unnion            = 'Ed. 1 · Outubro/2026';
const edicao_erus              = 'Ed. 1 · Outubro/2026';
const edicao_vantor_90         = 'Ed. 1 · Outubro/2026';
const edicao_linha_moveleira   = 'Ed. 1 · Outubro/2026';
const edicao_linha_implementos = 'Ed. 1 · Outubro/2026';
const edicao_kit_sacada_certa  = 'Ed. 1 · Outubro/2026';
const edicao_linha_25          = 'Ed. 1 · Outubro/2026';

function aplicarEdicoesNoHTML() {
  document.querySelectorAll('.edicao_chroma').forEach(el => el.innerHTML = edicao_chroma);
  document.querySelectorAll('.edicao_ecoline').forEach(el => el.innerHTML = edicao_ecoline);
  document.querySelectorAll('.edicao_ecostick').forEach(el => el.innerHTML = edicao_ecostick);
  document.querySelectorAll('.edicao_diversos').forEach(el => el.innerHTML = edicao_diversos);
  document.querySelectorAll('.edicao_grandline').forEach(el => el.innerHTML = edicao_grandline);
  document.querySelectorAll('.edicao_ecogrid').forEach(el => el.innerHTML = edicao_ecogrid);
  document.querySelectorAll('.edicao_tabelados').forEach(el => el.innerHTML = edicao_tabelados);
  document.querySelectorAll('.edicao_sophia').forEach(el => el.innerHTML = edicao_sophia);
  document.querySelectorAll('.edicao_minimalframe').forEach(el => el.innerHTML = edicao_minimalframe);
  document.querySelectorAll('.edicao_wallframe').forEach(el => el.innerHTML = edicao_wallframe);
  document.querySelectorAll('.edicao_slidinglass').forEach(el => el.innerHTML = edicao_slidinglass);
  document.querySelectorAll('.edicao_fachada_ventilada').forEach(el => el.innerHTML = edicao_fachada_ventilada);
  document.querySelectorAll('.edicao_artus').forEach(el => el.innerHTML = edicao_artus);
  document.querySelectorAll('.edicao_unnion').forEach(el => el.innerHTML = edicao_unnion);
  document.querySelectorAll('.edicao_erus').forEach(el => el.innerHTML = edicao_erus);
  document.querySelectorAll('.edicao_vantor_90').forEach(el => el.innerHTML = edicao_vantor_90);
  document.querySelectorAll('.edicao_linha_moveleira').forEach(el => el.innerHTML = edicao_linha_moveleira);
  document.querySelectorAll('.edicao_linha_implementos').forEach(el => el.innerHTML = edicao_linha_implementos);
  document.querySelectorAll('.edicao_kit_sacada_certa').forEach(el => el.innerHTML = edicao_kit_sacada_certa);
  document.querySelectorAll('.edicao_linha_25').forEach(el => el.innerHTML = edicao_linha_25);
}

aplicarEdicoesNoHTML();

const EDICOES_SISTEMAS = {
  chroma: edicao_chroma,
  ecoline: edicao_ecoline,
  ecoline25: edicao_ecoline,
  ecostick: edicao_ecostick,
  diversos: edicao_diversos,
  grandline: edicao_grandline,
  ecogrid: edicao_ecogrid,
  tabelados: edicao_tabelados,
  sophia: edicao_sophia,
  minimalframe: edicao_minimalframe,
  wallframe: edicao_wallframe,
  slidinglass: edicao_slidinglass,
  fachadaventilada: edicao_fachada_ventilada,
  artus: edicao_artus,
  unnion: edicao_unnion,
  erus: edicao_erus,
  vantor90: edicao_vantor_90,
  linhamoveleira: edicao_linha_moveleira,
  linhaimplementosrodoviarios: edicao_linha_implementos,
  kitsacadacerta: edicao_kit_sacada_certa,
  linha25: edicao_linha_25
};

const MSG_ERRO_BANCO = "No momento não foi possível carregar o banco de dados. Recarregue a página e tente novamente.";

let banco = { graficos_desempenho: [], perfis: [], acessorios: [] };
let erroCarregamentoBanco = false;
let abaAtiva = "perfis";
let sistemaAtivo = "todos";

// Estado separado por aba
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

// Observação PRIMEIRO (em cima) e Encaixe DEPOIS (embaixo)
const CAMPOS_PERFIL = [
  { chave: "peso",       rotulo: "Peso"       },
  { chave: "tipologia",  rotulo: "Tipologia"  },
  { chave: "acabamento", rotulo: "Acabamento" },
  { chave: "jx",         rotulo: "Momento de Inércia (Jx)" },
  { chave: "jy",         rotulo: "Momento de Inércia (Jy)" },
  { chave: "wx",         rotulo: "Módulo de Resistência (Wx)" },
  { chave: "wy",         rotulo: "Módulo de Resistência (Wy)" },
  { chave: "observacao", rotulo: "Observação", largo: true },
  { chave: "encaixe",    rotulo: "Encaixe / Compatibilidade", largo: true, clicavel: true },
];

const CAMPOS_ACESSORIO = [
  { chave: "acabamento",        rotulo: "Acabamento"  },
  { chave: "material",          rotulo: "Material"    },
  { chave: "tipo",              rotulo: "Tipo"        },
  { chave: "unidade_conversao", rotulo: "Unidade de conversão" },
  { chave: "observacao",        rotulo: "Observação",  largo: true },
  { chave: "aplicavel",         rotulo: "Aplicável nos perfis", largo: true, clicavel: true },
];

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function normalizar(texto) {
  return (texto || "").trim().toUpperCase().replace(/[\s\-*]+/g, "");
}

function normalizarBusca(texto) {
  return (texto || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-*_.]+/g, "");
}

// Converte campo de imagem (string única, string separada por vírgula)
function extrairListaImagens(valor, padraoFallback = "") {
  let lista = [];
  if (Array.isArray(valor)) {
    lista = valor.map(v => String(v || "").trim()).filter(Boolean);
  } else if (typeof valor === "string" && valor.trim() !== "") {
    lista = valor.split(/[|,]+/).map(s => s.trim()).filter(Boolean);
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

function ordenarNatural(lista) {
  return (lista || []).sort((a, b) => {
    return (a.codigo || a.id || "").localeCompare(b.codigo || b.id || "", undefined, { numeric: true, sensitivity: 'base' });
  });
}

function indexarBancoCatalogo() {
  banco.perfis = ordenarNatural(banco.perfis);
  banco.acessorios = ordenarNatural(banco.acessorios);
  if (banco.graficos_desempenho) {
    banco.graficos_desempenho = ordenarNatural(banco.graficos_desempenho);
  }

  const todosItens = [...(banco.perfis || []), ...(banco.acessorios || [])];
  todosItens.forEach(item => {
    item._codNorm = normalizar(item.codigo || "");
    item._codBusca = normalizarBusca(item.codigo || "");
    item._sistemasNorm = (item.sistema || "")
      .split(/[\/,]+/)
      .map(s => normalizarBusca(s))
      .filter(Boolean);
    item._buscaIndex = [
      item.codigo, item.nome, item.apelido, item.observacao,
      item.sistema, item.tipologia, item.tipo, item.encaixe, item.aplicavel
    ].filter(Boolean).map(v => normalizarBusca(v)).join(" ");
  });

  (banco.graficos_desempenho || []).forEach(g => {
    g._perfisNorm = (g.perfis_envolvidos || []).map(c => normalizar(c));
  });
}

function itemBateComTermo(item, termo) {
  const t = normalizarBusca(termo);
  return item._buscaIndex ? item._buscaIndex.includes(t) : false;
}

function itemPertenceAoSistema(item, sisFiltro) {
  if (!sisFiltro || sisFiltro === "todos") return true;
  if (!item._sistemasNorm || item._sistemasNorm.length === 0) return false;
  const alvo = normalizarBusca(sisFiltro);
  return item._sistemasNorm.some(normS => normS.includes(alvo) || alvo.includes(normS));
}

function obterEdicaoItem(item) {
  if (!item) return "";
  if (item.sistema) {
    // Pega o primeiro sistema caso pertença a mais de um
    const primeiroSis = item.sistema.split(/[\/,]+/)[0];
    const chave = normalizarBusca(primeiroSis);
    if (EDICOES_SISTEMAS[chave]) return EDICOES_SISTEMAS[chave];
  }
  return item.edicao || "";
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

function lerHistorico(aba = abaAtiva) {
  const chave = obterChaveHistorico(aba);
  try { return JSON.parse(localStorage.getItem(chave)) || []; }
  catch { return []; }
}

function salvarHistorico(codigo, aba = abaAtiva) {
  if (!codigo || !codigo.trim()) return;
  const valor = codigo.trim();

  const botoesSistema = Array.from(document.querySelectorAll(".sistema-btn")).flatMap(b => [
    normalizarBusca(b.dataset.sistema || ""),
    normalizarBusca(b.textContent || "")
  ]);
  if (botoesSistema.includes(normalizarBusca(valor)) || normalizarBusca(valor) === "todos") {
    return;
  }

  const chave = obterChaveHistorico(aba);
  let hist = lerHistorico(aba);
  hist = hist.filter(c => normalizarBusca(c) !== normalizarBusca(valor));
  hist.unshift(valor);
  if (hist.length > HISTORICO_MAX) hist = hist.slice(0, HISTORICO_MAX);
  localStorage.setItem(chave, JSON.stringify(hist));
  renderizarHistorico();
}

// Modal de confirmação antes de apagar as pesquisas recentes
function abrirModalConfirmacaoHistorico(mensagem, aoConfirmar) {
  const backdrop = criar("div", "confirmacao-modal-backdrop");
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", "Confirmar exclusão de pesquisas recentes");

  const caixa = criar("div", "confirmacao-modal-caixa");

  const topo = criar("div", "confirmacao-modal-topo");
  const icone = criar("div", "confirmacao-modal-icone");
  icone.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  topo.appendChild(icone);
  topo.appendChild(criar("h3", "confirmacao-modal-titulo", "Apagar pesquisas recentes"));
  caixa.appendChild(topo);

  caixa.appendChild(criar("p", "confirmacao-modal-texto", mensagem));

  const acoes = criar("div", "confirmacao-modal-acoes");
  const btnCancelar = criar("button", "btn-confirmar-cancelar", "Cancelar");
  btnCancelar.type = "button";

  const btnApagar = criar("button", "btn-confirmar-perigo");
  btnApagar.type = "button";
  btnApagar.innerHTML = '<i class="fa-solid fa-trash-can"></i> Confirmar e apagar';

  acoes.appendChild(btnCancelar);
  acoes.appendChild(btnApagar);
  caixa.appendChild(acoes);
  backdrop.appendChild(caixa);

  const fechar = () => {
    backdrop.classList.remove("aberto");
    setTimeout(() => backdrop.remove(), 180);
    document.removeEventListener("keydown", escHandler);
  };

  const escHandler = (e) => {
    if (e.key === "Escape") fechar();
  };

  btnCancelar.addEventListener("click", fechar);
  btnApagar.addEventListener("click", () => {
    aoConfirmar();
    fechar();
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) fechar();
  });
  document.addEventListener("keydown", escHandler);

  document.body.appendChild(backdrop);
  backdrop.getBoundingClientRect();
  backdrop.classList.add("aberto");
  btnApagar.focus();
}

function renderizarHistorico() {
  const container = document.getElementById("historico-container");
  if (!container) return;
  const chaveAtual = obterChaveHistorico(abaAtiva);

  const botoesSistema = Array.from(document.querySelectorAll(".sistema-btn")).flatMap(b => [
    normalizarBusca(b.dataset.sistema || ""),
    normalizarBusca(b.textContent || "")
  ]);
  const hist = lerHistorico(abaAtiva).filter(
    itemHist => !botoesSistema.includes(normalizarBusca(itemHist)) && normalizarBusca(itemHist) !== "todos"
  );

  container.replaceChildren();
  if (hist.length === 0) return;

  const cab = criar("div", "historico-cabecalho");
  cab.appendChild(criar("span", "historico-titulo", "Pesquisas recentes:"));
  const btnLimpar = criar("button", "historico-limpar", "");
  btnLimpar.type = "button";
  btnLimpar.title = abaAtiva === "perfis"
    ? "Limpar pesquisas recentes de Perfis"
    : "Limpar pesquisas recentes de Acessórios";
  btnLimpar.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  btnLimpar.addEventListener("click", () => {
    const nomeAba = abaAtiva === "perfis" ? "Perfis" : "Acessórios";
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

// Foto Ampliada
function abrirFoto(imagensOuSrc, alt, indiceInicial = 0) {
  const lista = Array.isArray(imagensOuSrc)
    ? imagensOuSrc.filter(Boolean)
    : [{ src: imagensOuSrc, leg: alt }];

  if (lista.length === 0) return;
  let idxAtual = Math.max(0, Math.min(indiceInicial, lista.length - 1));

  const modal = criar("div", "foto-modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", alt || "Imagem ampliada");

  const caixa = criar("div", "foto-modal-caixa");

  const legendaEl = criar("div", "foto-modal-legenda", lista[idxAtual].leg || alt || "");
  caixa.appendChild(legendaEl);

  const img = document.createElement("img");
  img.className = "foto-ampliada";
  img.src = lista[idxAtual].src;
  img.alt = lista[idxAtual].leg || alt || "";
  caixa.appendChild(img);

  let contadorEl = null;

  const atualizarSlide = (novoIdx) => {
    idxAtual = (novoIdx + lista.length) % lista.length;
    img.style.opacity = "0.25";
    setTimeout(() => {
      img.src = lista[idxAtual].src;
      img.alt = lista[idxAtual].leg || alt || "";
      legendaEl.textContent = lista[idxAtual].leg || alt || "";
      if (contadorEl) contadorEl.textContent = `${idxAtual + 1} / ${lista.length}`;
      img.style.opacity = "1";
    }, 110);
  };

  // Setinhas FontAwesome
  if (lista.length > 1) {
    const btnEsq = criar("button", "foto-modal-seta esq");
    btnEsq.type = "button";
    btnEsq.setAttribute("aria-label", "Imagem anterior");
    btnEsq.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    btnEsq.addEventListener("click", (e) => {
      e.stopPropagation();
      atualizarSlide(idxAtual - 1);
    });

    const btnDir = criar("button", "foto-modal-seta dir");
    btnDir.type = "button";
    btnDir.setAttribute("aria-label", "Próxima imagem");
    btnDir.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    btnDir.addEventListener("click", (e) => {
      e.stopPropagation();
      atualizarSlide(idxAtual + 1);
    });

    contadorEl = criar("span", "foto-modal-contador", `${idxAtual + 1} / ${lista.length}`);

    caixa.appendChild(btnEsq);
    caixa.appendChild(btnDir);
    caixa.appendChild(contadorEl);
  }

  const btnFechar = criar("button", "foto-fechar");
  btnFechar.type = "button";
  btnFechar.setAttribute("aria-label", "Fechar imagem");
  btnFechar.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  const fechar = () => {
    modal.classList.remove("foto-aberta");
    setTimeout(() => modal.remove(), 200);
    document.removeEventListener("keydown", keyListener);
  };

  const keyListener = (e) => {
    if (e.key === "Escape") fechar();
    if (lista.length > 1 && e.key === "ArrowLeft") atualizarSlide(idxAtual - 1);
    if (lista.length > 1 && e.key === "ArrowRight") atualizarSlide(idxAtual + 1);
  };

  btnFechar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });
  document.addEventListener("keydown", keyListener);

  modal.appendChild(caixa);
  modal.appendChild(btnFechar);
  document.body.appendChild(modal);

  modal.getBoundingClientRect();
  modal.classList.add("foto-aberta");
}

// Modal do Gráfico Estrutural
function abrirModalGraficoEstrutural(item, graficosDisponiveis) {
  const graficos = graficosDisponiveis && graficosDisponiveis.length > 0
    ? graficosDisponiveis
    : obterGraficosDoPerfil(item);

  if (graficos.length === 0) return;

  const modal = criar("div", "foto-modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
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
    seletorWrap.appendChild(criar("span", "grafico-seletor-label", `Montagens e combinações disponíveis (${graficos.length}):`));

    const botoesOpcoes = criar("div", "grafico-seletor-botoes");
    graficos.forEach((g, idx) => {
      const textoBtn = g.tipologia || g.descricao_montagem || `Opção ${idx + 1}`;
      const btnOp = criar("button", "btn-opcao-grafico" + (idx === 0 ? " ativo" : ""), textoBtn);
      btnOp.type = "button";
      btnOp.addEventListener("click", () => {
        botoesOpcoes.querySelectorAll(".btn-opcao-grafico").forEach(b => b.classList.remove("ativo"));
        btnOp.classList.add("ativo");
        graficoAtual = g;
        atualizarMidiaGrafico(graficoAtual.imagem_grafico, `Gráfico de Desempenho Estrutural — ${graficoAtual.descricao_montagem || item.codigo}`);
        atualizarResumoMontagem(graficoAtual);
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
  atualizarMidiaGrafico(graficoAtual.imagem_grafico, `Gráfico de Desempenho Estrutural — ${item.codigo}`);

  const barraBotoesGrafico = criar("div", "modal-grafico-acoes");
  const btnCurvaPerfil = criar("button", "btn btn-principal", `Gráfico do Perfil (${item.codigo})`);
  btnCurvaPerfil.type = "button";
  const btnMapaIsopletas = criar("button", "btn btn-secundario", "Ver Mapa das Regiões (Isopletas)");
  btnMapaIsopletas.type = "button";

  btnCurvaPerfil.addEventListener("click", () => {
    atualizarMidiaGrafico(graficoAtual.imagem_grafico, `Gráfico de Desempenho Estrutural — ${item.codigo}`);
    btnCurvaPerfil.className = "btn btn-principal";
    btnMapaIsopletas.className = "btn btn-secundario";
  });

  btnMapaIsopletas.addEventListener("click", () => {
    atualizarMidiaGrafico(MAPA_ISOPLETAS_IMG, "Mapa das Regiões de Vento (Isopletas - ABNT NBR 6123)");
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

  const fechar = () => {
    modal.classList.remove("foto-aberta");
    setTimeout(() => modal.remove(), 200);
    document.removeEventListener("keydown", escListener);
  };

  const escListener = (e) => { if (e.key === "Escape") fechar(); };

  btnFechar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });
  document.addEventListener("keydown", escListener);

  document.body.appendChild(modal);
  modal.getBoundingClientRect();
  modal.classList.add("foto-aberta");
}

// Compartilhar por URL
function atualizarUrlItem(item) {
  if (!window.history || !window.history.replaceState) return;
  const url = new URL(window.location);
  if (item && item.codigo) {
    url.searchParams.set("codigo", item.codigo);
    if (item.sistema) url.searchParams.set("sistema", item.sistema);
    url.searchParams.set("aba", abaAtiva);
  } else {
    url.searchParams.delete("codigo");
    url.searchParams.delete("sistema");
    url.searchParams.delete("aba");
  }
  window.history.replaceState({}, "", url);
}

function copiarLinkCompartilhamento(item, btn) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("codigo", item.codigo);
  if (item.sistema) url.searchParams.set("sistema", item.sistema);
  url.searchParams.set("aba", abaAtiva);

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

function irParaPerfilCompleto(codigoAlvo) {
  const resultado = encontrarItemPorCodigo(codigoAlvo, sistemaAtivo);
  const campoBusca = document.getElementById("busca-catalogo");
  const limpar = document.querySelector("#form-catalogo .btn-limpar");

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

// Cards de Imagem técnica, 3D e aplicada
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

    box.appendChild(img);

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
      // Ao clicar, abre o modal SOMENTE com as imagens desta categoria (Técnica, 3D ou Aplicada)!
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

function mostrarPreviewEncaixe(codClicado, containerPreview, btnClicado, wrapTags) {
  if (btnClicado.classList.contains("ativo")) {
    btnClicado.classList.remove("ativo");
    containerPreview.replaceChildren();
    return;
  }

  wrapTags.querySelectorAll(".ficha-tag-link").forEach(b => b.classList.remove("ativo"));
  btnClicado.classList.add("ativo");
  containerPreview.replaceChildren();

  const busca = encontrarItemPorCodigo(codClicado, sistemaAtivo);
  const card = criar("div", "encaixe-preview-card");

  if (!busca) {
    const infoVazia = criar("div", "encaixe-preview-info");
    infoVazia.appendChild(criar("p", "encaixe-preview-codigo", codClicado));
    infoVazia.appendChild(criar("p", "encaixe-preview-nome", "Item não foi encontrado no banco de dados!"));
    card.appendChild(infoVazia);
    containerPreview.appendChild(card);
    return;
  }

  const { item: alvo, aba } = busca;
  const pasta = aba === "perfis" ? "perfil" : "acessorio";
  const padrao = `assets/img/catalog/sistemas/${(alvo.sistema || "chroma").toLowerCase()}/${pasta}/${alvo.codigo}.webp`;
  const imgsAlvo = extrairListaImagens(alvo.imagem, padrao);
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

  if (alvo.encaixe || alvo.aplicavel) {
    const pEnc = criar("p", "encaixe-preview-detalhe");
    pEnc.innerHTML = `<strong>${aba === "perfis" ? "Encaixes" : "Aplicável em"}:</strong> ${alvo.encaixe || alvo.aplicavel}`;
    info.appendChild(pEnc);
  }

  const acoes = criar("div", "encaixe-preview-acoes");
  const btnIr = criar("button", "btn-ir-perfil");
  btnIr.type = "button";
  btnIr.innerHTML = `<i class="fa-solid fa-arrow-right"></i> Ver ficha completa de ${alvo.codigo}`;
  btnIr.addEventListener("click", () => irParaPerfilCompleto(alvo.codigo));
  acoes.appendChild(btnIr);

  info.appendChild(acoes);
  card.appendChild(info);
  containerPreview.appendChild(card);
}

function mostrarFicha(item) {
  estadoPorAba[abaAtiva].itemSelecionado = item;
  atualizarUrlItem(item);
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

  const linhaBadges = criar("div", "ficha-badges-linha");
  if (item.sistema && item.sistema.trim() !== "") {
    linhaBadges.appendChild(criar("span", "ficha-sistema", item.sistema));
  }

  const edicaoTexto = obterEdicaoItem(item);
  if (edicaoTexto) {
    const badgeEdicao = criar("span", "ficha-edicao");
    const ehDiversos = item.sistema && normalizarBusca(item.sistema) === "diversos";
    const prefixoFicha = ehDiversos || edicaoTexto.toLowerCase().includes("altera") ? "" : "Catálogo ";
    badgeEdicao.innerHTML = `<i class="fa-regular fa-calendar"></i> ${prefixoFicha}${edicaoTexto}`;
    linhaBadges.appendChild(badgeEdicao);
  }

  meta.appendChild(linhaBadges);
  cabInfo.appendChild(meta);
  header.appendChild(cabInfo);

  const btnComp = criar("button", "btn-compartilhar");
  btnComp.type = "button";
  btnComp.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Compartilhar';
  btnComp.title = "Copiar link direto para este item";
  btnComp.addEventListener("click", () => copiarLinkCompartilhamento(item, btnComp));
  header.appendChild(btnComp);

  ficha.appendChild(header);
  const trioImagens = criar("div", "ficha-imagens-trio");
  const pasta = abaAtiva === "perfis" ? "perfil" : "acessorio";
  const padraoTecnica = `assets/img/catalog/sistemas/${(item.sistema || "chroma").toLowerCase()}/${pasta}/${item.codigo}.webp`;

  const imgsTecnica = extrairListaImagens(item.imagem, padraoTecnica);
  const imgs3D = extrairListaImagens(item.imagem_3d, "");
  const imgsAplicada = extrairListaImagens(item.imagem_aplicavel, "");

  trioImagens.appendChild(criarBoxImagem(
    "imagem técnica",
    imgsTecnica,
    `Imagem técnica — ${item.codigo}`,
    "fa-regular fa-image",
    "Sem imagem técnica"
  ));

  trioImagens.appendChild(criarBoxImagem(
    "imagem 3D",
    imgs3D,
    `Vista 3D — ${item.codigo}`,
    "fa-solid fa-cube",
    "Sem imagem 3D"
  ));

  trioImagens.appendChild(criarBoxImagem(
    "imagem aplicada",
    imgsAplicada,
    `Imagem aplicada — ${item.codigo}`,
    "fa-solid fa-layer-group",
    "Sem imagem aplicada"
  ));

  ficha.appendChild(trioImagens);

  // Visualizar Gráfico de Desempenho
  const graficosDoItem = abaAtiva === "perfis" ? obterGraficosDoPerfil(item) : [];
  if (graficosDoItem.length > 0) {
    const secaoGrafico = criar("div", "ficha-secao-grafico");
    const btnGrafico = criar("button", "btn-ver-grafico");
    btnGrafico.type = "button";
    const qtdBadge = graficosDoItem.length > 1 ? ` (${graficosDoItem.length} montagens)` : "";
    btnGrafico.innerHTML = `<i class="fa-solid fa-chart-line"></i> Visualizar Gráfico de Desempenho e Regiões de Vento (BR)${qtdBadge}`;
    btnGrafico.addEventListener("click", () => abrirModalGraficoEstrutural(item, graficosDoItem));
    secaoGrafico.appendChild(btnGrafico);
    ficha.appendChild(secaoGrafico);
  }

  ficha.appendChild(criar("hr", "ficha-divisor"));

  // Campos Técnicos
  const grade = criar("dl", "ficha-campos");
  campos.forEach(({ chave, rotulo, largo, clicavel }) => {
    if (!item[chave] || String(item[chave]).trim() === "") return;

    const div = criar("div", "ficha-campo" + (largo ? " ficha-campo-largo" : ""));
    div.appendChild(criar("dt", "", rotulo));
    const dd = criar("dd", "");

    if (clicavel) {
      const wrapTags = criar("div", "ficha-tags");
      const containerPreview = criar("div", "encaixe-preview-container");

      String(item[chave]).split("/").map(s => s.trim()).filter(Boolean).forEach(cod => {
        const btnTag = criar("button", "ficha-tag-link", cod);
        btnTag.type = "button";
        btnTag.title = `Ver prévia de ${cod}`;
        btnTag.addEventListener("click", () => {
          mostrarPreviewEncaixe(cod, containerPreview, btnTag, wrapTags);
        });
        wrapTags.appendChild(btnTag);
      });

      dd.appendChild(wrapTags);
      dd.appendChild(containerPreview);
    } else if (String(item[chave]).includes("||")) {
      dd.innerHTML = String(item[chave]).split("||").join("<br>");
    } else {
      dd.textContent = item[chave];
    }

    div.appendChild(dd);
    grade.appendChild(div);
  });

  ficha.appendChild(grade);
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

  const chaveSis = normalizarBusca(sistemaAtivo);
  if (chaveSis !== "todos") {
    if (chaveSis === "diversos") {
      const textoDiv = EDICOES_SISTEMAS.diversos || "Última alteração: Outubro/2026";
      const seloDiversos = criar("span", "edicao-catalogo-badge");
      seloDiversos.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${textoDiv}`;
      cabecalhoLista.appendChild(seloDiversos);
    } else {
      const edicaoSis = EDICOES_SISTEMAS[chaveSis] || (itens[0] && obterEdicaoItem(itens[0]));
      if (edicaoSis) {
        const seloEdicao = criar("span", "edicao-catalogo-badge");
        seloEdicao.innerHTML = `<i class="fa-solid fa-book-open"></i> Referência: ${edicaoSis}`;
        cabecalhoLista.appendChild(seloEdicao);
      }
    }
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
    const padraoThumb = `assets/img/catalog/sistemas/${(item.sistema || "chroma").toLowerCase()}/${pasta}/${item.codigo}.webp`;
    thumb.src = obterPrimeiraImagem(item.imagem, padraoThumb);
    linha.appendChild(thumb);

    const info = criar("div", "catalogo-item-info");
    info.appendChild(criar("div", "catalogo-item-codigo", item.codigo));
    info.appendChild(criar("div", "catalogo-item-nome", item.nome || "—"));
    if (item.sistema || item.tipo) {
      const textoSis = item.sistema ? `${item.sistema}${obterEdicaoItem(item) ? " · " + obterEdicaoItem(item) : ""}` : item.tipo;
      info.appendChild(criar("div", "catalogo-item-sistema", textoSis));
    }
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
      estadoAtual.itemSelecionado = exatos[0];
      salvarHistorico(exatos[0].codigo, abaAtiva);
    } else {
      filtrados = filtrados.filter(item => itemBateComTermo(item, termo));
    }
  }

  mostrarLista(filtrados);
}

function construirFiltroSistemas() {
  const container = document.getElementById("filtro-sistemas");
  if (!container) return;

  const sistemasMap = new Map();
  container.querySelectorAll(".sistema-btn").forEach(btn => {
    const chave = (btn.dataset.sistema || btn.textContent || "").trim();
    const rotulo = btn.textContent.trim();
    if (chave && normalizarBusca(chave) !== "todos") {
      sistemasMap.set(normalizarBusca(chave), rotulo);
    }
  });

  [...banco.perfis, ...banco.acessorios].forEach(item => {
    if (item.sistema && item.sistema.trim() !== "" && item.sistema !== "Sem informação") {
      item.sistema.split(/[\/,]+/).map(s => s.trim()).filter(Boolean).forEach(sis => {
        const norm = normalizarBusca(sis);
        if (!sistemasMap.has(norm)) {
          sistemasMap.set(norm, sis);
        }
      });
    }
  });

  container.replaceChildren();

  const btnTodos = criar("button", "sistema-btn" + (sistemaAtivo === "todos" ? " sistema-btn-ativo" : ""), "Todos");
  btnTodos.type = "button";
  btnTodos.dataset.sistema = "todos";
  btnTodos.addEventListener("click", () => {
    estadoPorAba[abaAtiva].jaInteragiu = true;
    container.querySelectorAll(".sistema-btn").forEach(b => b.classList.remove("sistema-btn-ativo"));
    btnTodos.classList.add("sistema-btn-ativo");
    sistemaAtivo = "todos";
    executarFiltro();
  });
  container.appendChild(btnTodos);

  const sistemaTemItens = (sis) => {
    return [...banco.perfis, ...banco.acessorios].some(item => itemPertenceAoSistema(item, sis));
  };

  Array.from(sistemasMap.values()).forEach(sis => {
    const temItens = sistemaTemItens(sis);
    const ativo = normalizarBusca(sistemaAtivo) === normalizarBusca(sis);
    let classes = "sistema-btn";
    if (ativo) classes += " sistema-btn-ativo";
    if (!temItens) classes += " sistema-btn-desativado";

    const btn = criar("button", classes, sis);
    btn.type = "button";
    btn.dataset.sistema = sis;

    if (!temItens) {
      btn.title = "Sistema em desenvolvimento";
      btn.setAttribute("aria-disabled", "true");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
      });
    } else {
      btn.addEventListener("click", () => {
        estadoPorAba[abaAtiva].jaInteragiu = true;
        container.querySelectorAll(".sistema-btn").forEach(b => b.classList.remove("sistema-btn-ativo"));
        btn.classList.add("sistema-btn-ativo");
        sistemaAtivo = sis;
        executarFiltro();
      });
    }
    container.appendChild(btn);
  });
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
        campo.placeholder = abaAtiva === "perfis" ? "Ex: CHR057" : "Ex: VED030";
      }
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

  if (btnCamera) {
    btnCamera.addEventListener("click", () => {
      alert("Busca visual por foto em desenvolvimento! (EM BREVE)");
    });
  }
}

function atualizarRelogio() {
  const agora = new Date();
  const el = document.getElementById("data-hora");
  if (el) {
    el.textContent =
      agora.toLocaleDateString("pt-BR") +
      " · " +
      agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
}

function iniciarTema() {
  const btn = document.getElementById("btn-tema");
  const html = document.documentElement;

  const temaEscuro = () =>
    html.dataset.tema === "escuro" ||
    (!html.dataset.tema && matchMedia("(prefers-color-scheme: dark)").matches);

  const aplicar = (escuro) => {
    html.dataset.tema = escuro ? "escuro" : "claro";
    if (btn) {
      btn.innerHTML = escuro
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    }
    localStorage.setItem("tema", escuro ? "escuro" : "claro");
  };

  const salvo = localStorage.getItem("tema");
  aplicar(salvo ? salvo === "escuro" : true);

  if (btn) btn.addEventListener("click", () => aplicar(!temaEscuro()));
}

async function iniciar() {
  iniciarTema();
  atualizarRelogio();
  setInterval(atualizarRelogio, 30000);

  try {
    const resposta = await fetch("https://consulta-perfil-api.onrender.com/api/catalogo");
    if (!resposta.ok) throw new Error("Erro na API");
    const dados = await resposta.json();
    if (!dados || ((!dados.perfis || dados.perfis.length === 0) && (!dados.acessorios || dados.acessorios.length === 0))) {
      throw new Error("Banco vazio ou sem conexão com o Notion");
    }
    banco = dados;
    erroCarregamentoBanco = false;
    indexarBancoCatalogo();
  } catch {
    erroCarregamentoBanco = true;
  }

  construirFiltroSistemas();
  configurarAbas();
  configurarForm();
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

  if (sisParam) {
    const btnSis = Array.from(document.querySelectorAll(".sistema-btn")).find(
      b => normalizarBusca(b.dataset.sistema || b.textContent || "") === normalizarBusca(sisParam)
    );
    if (btnSis) {
      document.querySelectorAll(".sistema-btn").forEach(b => b.classList.remove("sistema-btn-ativo"));
      btnSis.classList.add("sistema-btn-ativo");
      sistemaAtivo = btnSis.dataset.sistema;
    }
  }

  if (codParam) {
    const busca = encontrarItemPorCodigo(codParam, sisParam || sistemaAtivo);
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