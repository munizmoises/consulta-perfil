const versao_atual = '4.5.0';
const NOVIDADES_SEMPRE = false;

const API_URL = "https://consulta-perfil-api.onrender.com";
// const API_URL = "http://127.0.0.1:5000";

// Sem .html no site, com .html rodando local
const RODANDO_LOCAL = ["localhost", "127.0.0.1", ""].includes(location.hostname);

function linkPagina(nome) {
  if (RODANDO_LOCAL) return (nome || "index") + ".html";
  return nome || "./";
}

if (!RODANDO_LOCAL && location.pathname.endsWith(".html")) {
  history.replaceState(null, "", location.pathname.replace(/(index)?\.html$/, "") + location.search + location.hash);
}

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

// Troca "||" por quebra de linha
function textoComQuebras(el, texto) {
  String(texto).split("||").forEach((parte, i) => {
    if (i) el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(parte));
  });
}

// Gold -> Chroma
function textoComSeta(el, texto) {
  String(texto).split(/\s*->\s*/).forEach((parte, i) => {
    if (i) el.appendChild(criar("i", "fa-solid fa-arrow-right seta-conversao"));
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
  img.draggable = false;
  caixa.append(legendaEl, img);

  // Zoom com a rodinha, arrastar move e duplo clique volta
  let zoom = 1, x = 0, y = 0, arrasto = null;
  const aplicarZoom = () => {
    img.style.transform = zoom === 1 ? "" : `translate(${x}px, ${y}px) scale(${zoom})`;
    img.classList.toggle("com-zoom", zoom > 1);
  };
  const zerarZoom = () => { zoom = 1; x = 0; y = 0; aplicarZoom(); };
  img.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = img.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const novo = Math.min(8, Math.max(1, zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2)));
    x -= px * (novo / zoom - 1);
    y -= py * (novo / zoom - 1);
    zoom = novo;
    if (zoom === 1) { x = 0; y = 0; }
    aplicarZoom();
  }, { passive: false });
  img.addEventListener("pointerdown", (e) => {
    if (zoom === 1) return;
    arrasto = { px: e.clientX, py: e.clientY, x, y };
    img.setPointerCapture(e.pointerId);
  });
  img.addEventListener("pointermove", (e) => {
    if (!arrasto) return;
    x = arrasto.x + e.clientX - arrasto.px;
    y = arrasto.y + e.clientY - arrasto.py;
    aplicarZoom();
  });
  const soltar = () => { arrasto = null; };
  img.addEventListener("pointerup", soltar);
  img.addEventListener("pointercancel", soltar);
  img.addEventListener("dblclick", zerarZoom);

  let contadorEl = null;
  const irPara = (novoIdx) => {
    idxAtual = (novoIdx + lista.length) % lista.length;
    zerarZoom();
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

// Páginas do menu
const PAGINAS = [
  { nome: "", rotulo: "Substituições", icone: "fa-repeat" },
  { nome: "catalogo", rotulo: "Catálogo Técnico", icone: "fa-book-open" },
  { nome: "modelo3d", rotulo: "Modelos 3D", icone: "fa-cube" },
];

function montarCabecalho() {
  const barra = document.querySelector("header.barra[data-titulo]");
  if (!barra) return;
  const atual = location.pathname.split("/").pop().replace(/\.html$/, "").replace(/^index$/, "");
  const links = comIcone => PAGINAS.map(p =>
    `<a href="${linkPagina(p.nome)}" class="nav-link${p.nome === atual ? " nav-link-ativo" : ""}"${p.nome === atual ? ' aria-current="page"' : ""}>` +
    `${comIcone ? `<i class="fa-solid ${p.icone}"></i> ` : ""}${p.rotulo}</a>`).join("");

  barra.innerHTML = `
    <div class="barra-marca">
      <a href="${linkPagina("")}" class="barra-marca-link">
        <img class="logo" src="assets/img/logo.png" alt="" width="34" height="34">
        <span class="barra-marca-titulo">Consulta Perfil</span>
      </a>
      <nav class="barra-nav barra-nav-desktop">${links(false)}</nav>
    </div>
    <h1 class="barra-titulo"></h1>
    <div class="barra-info">
      <time id="data-hora"></time>
      <button id="btn-tema" class="btn-tema" type="button" aria-label="Alternar tema" title="Alternar tema"></button>
      <div class="dropdown">
        <button id="btn-usuario" class="btn-usuario dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menu do usuário" title="Área do Usuário">
          <i class="fa-solid fa-user"></i>
        </button>
        <div class="dropdown-menu dropdown-menu-end usuario-dropdown-menu">
          <div class="usuario-cabecalho">
            <div class="usuario-avatar"><i class="fa-solid fa-user-tie"></i></div>
            <div class="usuario-dados">
              <p class="usuario-nome">Perfil Alumínio</p>
              <p class="usuario-cargo">Moisés Muniz</p>
            </div>
          </div>
          <a href="${linkPagina("")}" class="usuario-item"><i class="fa-solid fa-repeat"></i> Substituições</a>
          <a href="${linkPagina("catalogo")}" class="usuario-item"><i class="fa-solid fa-book-open"></i> Catálogo Técnico</a>
          <button type="button" class="usuario-item" id="abrir-novidades"><i class="fa-solid fa-bullhorn"></i> Novidades</button>
          <a href="https://perfilaluminio.com.br/sobre" target="_blank" class="usuario-item"><i class="fa-solid fa-suitcase"></i> Conheça a Perfil Alumínio</a>
        </div>
      </div>
      <button class="btn-hamburguer" type="button" data-bs-toggle="collapse" data-bs-target="#menuNavegacaoMobile" aria-controls="menuNavegacaoMobile" aria-expanded="false" aria-label="Abrir menu de navegação">
        <i class="fa-solid fa-bars"></i>
      </button>
    </div>
    <div class="collapse barra-collapse-mobile" id="menuNavegacaoMobile">
      <nav class="menu-hamburguer-box">${links(true)}</nav>
    </div>`;
  barra.querySelector(".barra-titulo").textContent = barra.dataset.titulo;
  barra.querySelector("#abrir-novidades").addEventListener("click", mostrarNovidades);
}

montarCabecalho();

// NOVIDADES 
const NOVIDADES = {
  data: "25/11/2026",
  abertura: "Mais uma atualizada no Consulta Perfil:",
  itens: [
    "O site agora tem endereço próprio: consultaperfil.com.br. O catálogo fica em /catalogo e os modelos 3D em /modelo3d.",
    "Dá pra dar zoom nas imagens com a rodinha do mouse. Arrasta pra mover e dois cliques volta ao normal.",
    "Na ficha do perfil agora tem \"Perfis aplicáveis\" e \"Acessórios aplicáveis\" separados.",
    "Mais fotos nos acessórios do Ecoline, Kit Sacada Certa e Vantor 90. Alguns itens têm mais de uma foto, é só passar pelas setas.",
    "A Linha 25 ganhou os modelos 3D.",
    "O Vantor 90 ganhou o Veda Porta, o Puxador e o Selante que faltavam.",
    "O CM-804 (chumbador) agora está nos acessórios, e as medidas dos braços BRA-702 e BRA-703 foram corrigidas.",
  ],
  fechamento: "Se achar alguma coisa estranha por ai, me avisa. Moisés!",
};
const CHAVE_NOVIDADES = "novidades_vistas";

function lerGuardado(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

function guardar(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { }
}

function mostrarNovidades() {
  if (document.querySelector(".novidades-caixa")) return;
  guardar(CHAVE_NOVIDADES, versao_atual);

  const fundo = criar("div", "confirmacao-modal-backdrop");
  fundo.setAttribute("aria-label", "O que mudou no Consulta Perfil");
  const caixa = criar("div", "confirmacao-modal-caixa novidades-caixa");

  caixa.append(
    criar("h3", "novidades-titulo", "O que mudou"),
    criar("span", "novidades-versao", `Versão ${versao_atual} · ${NOVIDADES.data}`),
    criar("p", "novidades-texto", NOVIDADES.abertura),
  );
  const lista = criar("ul", "novidades-lista");
  NOVIDADES.itens.forEach(item => lista.appendChild(criar("li", "", item)));
  caixa.append(lista, criar("p", "novidades-texto novidades-assinatura", NOVIDADES.fechamento));

  const acoes = criar("div", "confirmacao-modal-acoes");
  const ok = criar("button", "btn-confirmar-cancelar", "Fechar");
  ok.type = "button";
  acoes.appendChild(ok);
  caixa.appendChild(acoes);

  fundo.appendChild(caixa);
  const fechar = abrirModal(fundo, "aberto");
  ok.addEventListener("click", fechar);
}

if (NOVIDADES_SEMPRE || lerGuardado(CHAVE_NOVIDADES) !== versao_atual) setTimeout(mostrarNovidades, 600);
