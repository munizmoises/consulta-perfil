const NO_PHOTO = "assets/img/catalog/NO-PHOTO.webp";

let banco = { perfis: [], acessorios: [] };
let abaAtiva = "perfis";
let itemSelecionado = null;

const CAMPOS_PERFIL = [
  { chave: "peso",       rotulo: "Peso"       },
  { chave: "tipologia",  rotulo: "Tipologia"  },
  { chave: "acabamento", rotulo: "Acabamento" },
  { chave: "encaixe",    rotulo: "Encaixe",   largo: true },
  { chave: "observacao", rotulo: "Observação", largo: true },
];

const CAMPOS_ACESSORIO = [
  { chave: "aplicavel",         rotulo: "Aplicável nos perfis", largo: true },
  { chave: "acabamento",        rotulo: "Acabamento"  },
  { chave: "material",          rotulo: "Material"    },
  { chave: "tipo",              rotulo: "Tipo"        },
  { chave: "unidade_conversao", rotulo: "Unidade de conversão" },
  { chave: "observacao",        rotulo: "Observação",  largo: true },
];

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function normalizarBusca(texto) {
  return texto.trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[\s\-*]+/g, "");
}

function itemBate(item, termo) {
  const t = normalizarBusca(termo);
  return [item.codigo, item.nome, item.apelido, item.observacao, item.sistema, item.tipologia, item.tipo]
    .some(v => v && normalizarBusca(v).includes(t));
}

// Foto ampliada
function abrirFoto(src, alt) {
  const modal = criar("div", "foto-modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", alt);

  const img = document.createElement("img");
  img.className = "foto-ampliada";
  img.src = src;
  img.alt = alt;

  const btnFechar = criar("button", "foto-fechar");
  btnFechar.type = "button";
  btnFechar.setAttribute("aria-label", "Fechar imagem");
  btnFechar.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  const fechar = () => {
    modal.classList.remove("foto-aberta");
    setTimeout(() => modal.remove(), 200);
    document.removeEventListener("keydown", escListener);
  };

  const escListener = (e) => { if (e.key === "Escape") fechar(); };

  btnFechar.addEventListener("click", fechar);
  modal.addEventListener("click", (e) => { if (e.target === modal) fechar(); });
  document.addEventListener("keydown", escListener);

  modal.appendChild(img);
  modal.appendChild(btnFechar);
  document.body.appendChild(modal);

  modal.getBoundingClientRect();
  modal.classList.add("foto-aberta");
}

// Ficha técnica
function mostrarFicha(item, campos) {
  const ficha = document.getElementById("ficha-tecnica");
  ficha.replaceChildren();

  const topo = criar("div", "ficha-topo");

  // Imagem
  const imgWrap = criar("div", "ficha-imagem-wrap");
  const img = document.createElement("img");
  img.className = "ficha-imagem";
  img.alt = item.codigo;
  img.loading = "lazy";
  img.onerror = () => { img.src = NO_PHOTO; };
  img.src = item.imagem && item.imagem.trim() !== "" ? item.imagem : NO_PHOTO;
  img.addEventListener("click", () => {
    if (!img.src.includes("NO-PHOTO")) abrirFoto(img.src, item.nome || item.codigo);
  });
  imgWrap.appendChild(img);
  topo.appendChild(imgWrap);

  // Cabeçalho
  const cab = criar("div", "ficha-cabecalho");
  cab.appendChild(criar("p", "ficha-codigo", item.codigo));
  cab.appendChild(criar("h2", "ficha-nome", item.nome || "—"));
  if (item.sistema) cab.appendChild(criar("span", "ficha-sistema", item.sistema));
  if (item.apelido) {
    const ap = criar("p", "ficha-apelido");
    ap.style.cssText = "margin: 0.4rem 0 0; font-size: 0.85rem; color: var(--suave);";
    ap.textContent = "Nome popular: " + item.apelido;
    cab.appendChild(ap);
  }
  topo.appendChild(cab);
  ficha.appendChild(topo);

  const grade = criar("dl", "ficha-campos");
  campos.forEach(({ chave, rotulo, largo }) => {
    if (!item[chave] || item[chave].trim() === "") return;
    const div = criar("div", "ficha-campo" + (largo ? " ficha-campo-largo" : ""));
    div.appendChild(criar("dt", "", rotulo));
    const dd = criar("dd", "");
    if (item[chave].includes("||")) {
      dd.innerHTML = item[chave].split("||").join("<br>");
    } else {
      dd.textContent = item[chave];
    }
    div.appendChild(dd);
    grade.appendChild(div);
  });
  ficha.appendChild(grade);
}

// Lista de resultados
function mostrarLista(itens, campos) {
  const resultado = document.getElementById("resultado-catalogo");
  resultado.replaceChildren();

  if (itens.length === 0) {
    resultado.appendChild(criar("span", "status erro", "Nenhum resultado"));
    return;
  }

  const label = itens.length === 1
    ? "1 resultado"
    : `${itens.length} resultados`;
  resultado.appendChild(criar("span", "status ok", label));

  itens.forEach(item => {
    const linha = criar("div", "catalogo-item-lista");

    const thumb = document.createElement("img");
    thumb.className = "catalogo-item-thumb";
    thumb.alt = item.codigo;
    thumb.loading = "lazy";
    thumb.onerror = () => { thumb.src = NO_PHOTO; };
    thumb.src = item.imagem && item.imagem.trim() !== "" ? item.imagem : NO_PHOTO;
    linha.appendChild(thumb);

    const info = criar("div", "catalogo-item-info");
    info.appendChild(criar("div", "catalogo-item-codigo", item.codigo));
    info.appendChild(criar("div", "catalogo-item-nome", item.nome || "—"));
    if (item.sistema || item.tipo) {
      info.appendChild(criar("div", "catalogo-item-sistema", item.sistema || item.tipo));
    }
    linha.appendChild(info);

    linha.addEventListener("click", () => {
      document.querySelectorAll(".catalogo-item-lista").forEach(el => el.classList.remove("selecionado"));
      linha.classList.add("selecionado");
      itemSelecionado = item;
      mostrarFicha(item, campos);
    });

    resultado.appendChild(linha);
  });

  // Abre o primeiro automaticamente
  resultado.querySelector(".catalogo-item-lista")?.click();
}

// Busca
function executarBusca(termo) {
  const campos = abaAtiva === "perfis" ? CAMPOS_PERFIL : CAMPOS_ACESSORIO;
  const lista = banco[abaAtiva];

  if (!termo.trim()) {
    mostrarLista(lista, campos);
    return;
  }

  const achados = lista.filter(item => itemBate(item, termo));
  mostrarLista(achados, campos);
}

// Relógio/Data

function atualizarRelogio() {
  const agora = new Date();
  document.getElementById("data-hora").textContent =
    agora.toLocaleDateString("pt-BR") +
    " · " +
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Temas ESCURO ou CLARO

function iniciarTema() {
  const btn = document.getElementById("btn-tema");
  const html = document.documentElement;

  const temaEscuro = () =>
    html.dataset.tema === "escuro" ||
    (!html.dataset.tema && matchMedia("(prefers-color-scheme: dark)").matches);

  const aplicar = (escuro) => {
    html.dataset.tema = escuro ? "escuro" : "claro";
    btn.innerHTML = escuro
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem("tema", escuro ? "escuro" : "claro");
  };

  const salvo = localStorage.getItem("tema");
  if (salvo) {
    aplicar(salvo === "escuro");
  } else {
    aplicar(true); // padrão: escuro
  }

  btn.addEventListener("click", () => aplicar(!temaEscuro()));
}

// Abas
function configurarAbas() {
  document.querySelectorAll(".catalogo-aba").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".catalogo-aba").forEach(b => b.classList.remove("catalogo-aba-ativa"));
      btn.classList.add("catalogo-aba-ativa");
      abaAtiva = btn.dataset.aba;
      document.getElementById("busca-catalogo").value = "";
      document.getElementById("ficha-tecnica").innerHTML = '<p class="ficha-vazia">Pesquise um código ou nome para ver a ficha técnica.</p>';
      executarBusca("");
    });
  });
}

function configurarForm() {
  const form = document.getElementById("form-catalogo");
  const campo = document.getElementById("busca-catalogo");
  const limpar = form.querySelector(".btn-limpar");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    limpar.hidden = false;
    executarBusca(campo.value);
  });

  campo.addEventListener("input", () => {
    executarBusca(campo.value);
  });

  limpar.addEventListener("click", () => {
    campo.value = "";
    limpar.hidden = true;
    document.getElementById("resultado-catalogo").replaceChildren();
    document.getElementById("ficha-tecnica").innerHTML = '<p class="ficha-vazia">Pesquise um código ou nome para ver a ficha técnica.</p>';
    campo.focus();
  });
}

async function iniciar() {
  iniciarTema();
  atualizarRelogio();
  setInterval(atualizarRelogio, 60000);

  try {
    const resposta = await fetch("banco_catalog.json");
    banco = await resposta.json();
  } catch {
    document.getElementById("resultado-catalogo").appendChild(
      criar("p", "msg-erro", "Não foi possível carregar o banco de dados. Recarregue a página e tente novamente.")
    );
  }

  configurarAbas();
  configurarForm();
}

iniciar();