const versao_atual = '4.1.0';

const API_URL = "https://consulta-perfil-api.onrender.com";
// const API_URL = "http://127.0.0.1:5000";

const MSG_ERRO_BANCO = "No momento não foi possível carregar o banco de dados. Recarregue a página e tente novamente.";
const HISTORICO_MAX = 5;

document.querySelectorAll('.versao_atual').forEach(el => el.innerHTML = versao_atual);

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
    .replace(/[\s\-*_.>→]+/g, "");
}

// troca "||" por quebra de linha
function textoComQuebras(el, texto) {
  String(texto).split("||").forEach((parte, i) => {
    if (i) el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(parte));
  });
}

let cargasEmAndamento = 0;

async function carregarBanco(rota) {
  cargasEmAndamento++;
  const aviso = setTimeout(() => {
    if (document.querySelector(".aviso-carregando")) return;
    const el = criar("div", "aviso-carregando", "Carregando os dados do servidor. Quando ele acaba de acordar pode levar alguns minutos...");
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }, 2500);
  try {
    let resposta = await fetch(`${API_URL}${rota}`);
    for (let tentativa = 0; resposta.status === 503 && tentativa < 60; tentativa++) {
      await new Promise(resolver => setTimeout(resolver, 5000));
      resposta = await fetch(`${API_URL}${rota}`);
    }
    if (!resposta.ok) throw new Error("Erro na API");
    const dados = await resposta.json();
    if (!dados || (!dados.perfis?.length && !dados.acessorios?.length)) {
      throw new Error("Banco vazio");
    }
    return dados;
  } finally {
    clearTimeout(aviso);
    if (--cargasEmAndamento === 0) document.querySelectorAll(".aviso-carregando").forEach(el => el.remove());
  }
}

function lerHistorico(chave) {
  try { return JSON.parse(localStorage.getItem(chave)) || []; }
  catch { return []; }
}

function gravarHistorico(chave, codigo) {
  const valor = (codigo || "").trim();
  if (!valor) return;
  const hist = lerHistorico(chave).filter(c => normalizarBusca(c) !== normalizarBusca(valor));
  hist.unshift(valor);
  localStorage.setItem(chave, JSON.stringify(hist.slice(0, HISTORICO_MAX)));
}

function botaoIcone(classe, icone, rotulo) {
  const btn = criar("button", classe);
  btn.type = "button";
  btn.innerHTML = `<i class="${icone}"></i>`;
  if (rotulo) btn.setAttribute("aria-label", rotulo);
  return btn;
}

function abrirModal(modal, classeAberta, aoTeclar) {
  const fechar = () => {
    modal.classList.remove(classeAberta);
    setTimeout(() => modal.remove(), 180);
    document.removeEventListener("keydown", teclado);
  };
  const teclado = (e) => {
    if (e.key === "Escape") fechar();
    else if (aoTeclar) aoTeclar(e);
  };

  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });
  document.addEventListener("keydown", teclado);
  document.body.appendChild(modal);
  modal.getBoundingClientRect();
  modal.classList.add(classeAberta);
  return fechar;
}

function abrirModalConfirmacaoHistorico(mensagem, aoConfirmar) {
  const backdrop = criar("div", "confirmacao-modal-backdrop");
  backdrop.setAttribute("aria-label", "Confirmar exclusão de pesquisas recentes");

  const caixa = criar("div", "confirmacao-modal-caixa");
  const topo = criar("div", "confirmacao-modal-topo");
  const icone = criar("div", "confirmacao-modal-icone");
  icone.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  topo.append(icone, criar("h3", "confirmacao-modal-titulo", "Apagar pesquisas recentes"));

  const acoes = criar("div", "confirmacao-modal-acoes");
  const btnCancelar = criar("button", "btn-confirmar-cancelar", "Cancelar");
  btnCancelar.type = "button";
  const btnApagar = criar("button", "btn-confirmar-perigo");
  btnApagar.type = "button";
  btnApagar.innerHTML = '<i class="fa-solid fa-trash-can"></i> Confirmar e apagar';
  acoes.append(btnCancelar, btnApagar);

  caixa.append(topo, criar("p", "confirmacao-modal-texto", mensagem), acoes);
  backdrop.appendChild(caixa);

  const fechar = abrirModal(backdrop, "aberto");
  btnCancelar.addEventListener("click", fechar);
  btnApagar.addEventListener("click", () => {
    aoConfirmar();
    fechar();
  });
  btnApagar.focus();
}

function abrirFoto(imagensOuSrc, alt, indiceInicial = 0) {
  const lista = Array.isArray(imagensOuSrc)
    ? imagensOuSrc.filter(Boolean)
    : [{ src: imagensOuSrc, leg: alt }];
  if (lista.length === 0) return;

  let idxAtual = Math.max(0, Math.min(indiceInicial, lista.length - 1));
  const modal = criar("div", "foto-modal");
  modal.setAttribute("aria-label", alt || "Imagem ampliada");

  const caixa = criar("div", "foto-modal-caixa");
  const legendaEl = criar("div", "foto-modal-legenda", lista[idxAtual].leg || alt || "");
  const img = document.createElement("img");
  img.className = "foto-ampliada";
  img.src = lista[idxAtual].src;
  img.alt = lista[idxAtual].leg || alt || "";
  caixa.append(legendaEl, img);

  let contadorEl = null;
  const irPara = (novoIdx) => {
    idxAtual = (novoIdx + lista.length) % lista.length;
    img.style.opacity = "0.25";
    setTimeout(() => {
      img.src = lista[idxAtual].src;
      img.alt = lista[idxAtual].leg || alt || "";
      legendaEl.textContent = lista[idxAtual].leg || alt || "";
      if (contadorEl) contadorEl.textContent = `${idxAtual + 1} / ${lista.length}`;
      img.style.opacity = "1";
    }, 100);
  };

  if (lista.length > 1) {
    const btnEsq = botaoIcone("foto-modal-seta esq", "fa-solid fa-chevron-left", "Imagem anterior");
    const btnDir = botaoIcone("foto-modal-seta dir", "fa-solid fa-chevron-right", "Próxima imagem");
    btnEsq.addEventListener("click", (e) => { e.stopPropagation(); irPara(idxAtual - 1); });
    btnDir.addEventListener("click", (e) => { e.stopPropagation(); irPara(idxAtual + 1); });
    contadorEl = criar("span", "foto-modal-contador", `${idxAtual + 1} / ${lista.length}`);
    caixa.append(btnEsq, btnDir, contadorEl);
  }

  const btnFechar = botaoIcone("foto-fechar", "fa-solid fa-xmark", "Fechar imagem");
  modal.append(caixa, btnFechar);

  const fechar = abrirModal(modal, "foto-aberta", (e) => {
    if (lista.length < 2) return;
    if (e.key === "ArrowLeft") irPara(idxAtual - 1);
    if (e.key === "ArrowRight") irPara(idxAtual + 1);
  });
  btnFechar.addEventListener("click", fechar);
}

function iniciarRelogio() {
  const el = document.getElementById("data-hora");
  if (!el) return;
  const atualizar = () => {
    const agora = new Date();
    el.textContent = agora.toLocaleDateString("pt-BR") + " · " +
      agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  atualizar();
  setInterval(atualizar, 30000);
}

function iniciarTema() {
  const btn = document.getElementById("btn-tema");
  const html = document.documentElement;

  const aplicar = (escuro) => {
    html.dataset.tema = escuro ? "escuro" : "claro";
    if (btn) btn.innerHTML = `<i class="fa-solid fa-${escuro ? "sun" : "moon"}"></i>`;
  };

  // Modo claro - padrão
  localStorage.removeItem("tema");
  aplicar(localStorage.getItem("tema_escolhido") === "escuro");
  if (btn) btn.addEventListener("click", () => {
    aplicar(html.dataset.tema !== "escuro");
    localStorage.setItem("tema_escolhido", html.dataset.tema);
  });
}
