const CAMPOS_PERFIS = [
  ["substituicao", "Substituição", true],
  ["nome", "Nome"],
  ["apelido", "Nome popular"],
  ["observacao", "Observação"],
  ["sistema", "Sistema"],
];

const CAMPOS_ACESSORIOS = [
  ["substituicao", "Substituição", true],
  ["nome", "Nome"],
  ["apelido", "Nome popular"],
  ["observacao", "Observação"],
  ["tipo", "Tipo"],
  ["unidade_conversao", "Unidade de conversão"],
];

const HISTORICO_MAX = 5;
const HISTORICO_KEY_PERFIS = "historico_perfis";
const HISTORICO_KEY_ACESSORIOS = "historico_acessorios";
const NO_PHOTO = "assets/img/substitution/NO-PHOTO.webp";
const SUGESTOES_MAX = 6;
const MSG_ERRO_BANCO = "No momento não foi possível carregar o banco de dados. Recarregue a página e tente novamente.";

let banco = { perfis: [], acessorios: [] };
let erroCarregamentoBanco = false;

function normalizar(texto) {
  return (texto || "").trim().toUpperCase().replace(/[\s\-*]+/g, "");
}

function normalizarBusca(texto) {
  return (texto || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-*_.]+/g, "");
}

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function exibirErroBanco(container) {
  if (!container) return;
  container.replaceChildren();
  container.appendChild(criar("p", "msg-erro", MSG_ERRO_BANCO));
}

function indexarBancoSubstituicoes() {
  [...(banco.perfis || []), ...(banco.acessorios || [])].forEach(item => {
    item._codNorm = normalizar(item.codigo || "");
    item._codBusca = normalizarBusca(item.codigo || "");
    item._partesCodNorm = (item.codigo || "").split(/[+\/]+/).map(p => normalizar(p)).filter(Boolean);
    item._partesCodBusca = (item.codigo || "").split(/[+\/]+/).map(p => normalizarBusca(p)).filter(Boolean);
    item._nomeBusca = normalizarBusca(item.nome || "");
    item._apelidoBusca = normalizarBusca(item.apelido || "");
    item._subBusca = normalizarBusca(item.substituicao || "");
    item._textoCompletoBusca = [
      item.codigo, item.substituicao, item.nome, item.apelido, item.observacao, item.sistema, item.tipo
    ].filter(Boolean).map(v => normalizarBusca(v)).join(" ");
  });
}

function codigoBateExato(item, codigoDigitadoNorm) {
  if (!item || !codigoDigitadoNorm) return false;
  if (item._codNorm === codigoDigitadoNorm) return true;
  return Array.isArray(item._partesCodNorm) && item._partesCodNorm.includes(codigoDigitadoNorm);
}

function lerHistorico(chave) {
  try { return JSON.parse(localStorage.getItem(chave)) || []; }
  catch { return []; }
}

function salvarHistorico(chave, codigo) {
  if (!codigo || !codigo.trim()) return;
  const valor = codigo.trim();
  let hist = lerHistorico(chave);
  hist = hist.filter(c => normalizarBusca(c) !== normalizarBusca(valor));
  hist.unshift(valor);
  if (hist.length > HISTORICO_MAX) hist = hist.slice(0, HISTORICO_MAX);
  localStorage.setItem(chave, JSON.stringify(hist));
}

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
    setTimeout(() => backdrop.remove(), 150);
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

function renderizarHistorico(chave, campo, resultado) {
  const hist = lerHistorico(chave);
  const existente = document.getElementById("historico-" + chave);
  if (existente) existente.remove();
  if (hist.length === 0) return;

  const bloco = document.createElement("div");
  bloco.id = "historico-" + chave;
  bloco.className = "historico";
  const cabecalho = criar("div", "historico-cabecalho");
  cabecalho.appendChild(criar("p", "historico-titulo", "Pesquisas recentes:"));

  const btnLimpar = criar("button", "historico-limpar", "");
  btnLimpar.type = "button";
  btnLimpar.setAttribute("aria-label", "Limpar histórico");
  btnLimpar.title = "Apagar pesquisas recentes";
  btnLimpar.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  btnLimpar.addEventListener("click", () => {
    const tipoHist = chave === HISTORICO_KEY_PERFIS ? "Perfis" : "Acessórios";
    abrirModalConfirmacaoHistorico(
      `Tem certeza de que deseja apagar todas as pesquisas recentes de ${tipoHist}?`,
      () => {
        localStorage.removeItem(chave);
        bloco.remove();
      }
    );
  });
  cabecalho.appendChild(btnLimpar);
  bloco.appendChild(cabecalho);

  const lista = document.createElement("div");
  lista.className = "historico-lista";

  hist.forEach(cod => {
    const btn = criar("button", "historico-item", cod);
    btn.type = "button";
    btn.addEventListener("click", () => {
      campo.value = cod;
      campo.form.requestSubmit();
    });
    lista.appendChild(btn);
  });

  bloco.appendChild(lista);
  resultado.parentNode.insertBefore(bloco, resultado);
}

// Pesquisa Inteligente

function buscarSugestoes(lista, termo) {
  if (erroCarregamentoBanco || !termo || termo.length < 1) return [];
  const t = normalizarBusca(termo);
  if (!t) return [];

  const score = (item) => {
    if (item._codBusca.startsWith(t) || item._partesCodBusca.some(p => p.startsWith(t))) return 1;
    if (item._nomeBusca.startsWith(t) || item._apelidoBusca.startsWith(t) || item._subBusca.startsWith(t)) return 2;
    if (item._textoCompletoBusca.includes(t)) return 3;
    return 99;
  };

  return (lista || [])
    .map(item => ({ item, s: score(item) }))
    .filter(({ s }) => s < 99)
    .sort((a, b) => a.s - b.s || (a.item.codigo || "").localeCompare(b.item.codigo || ""))
    .slice(0, SUGESTOES_MAX)
    .map(({ item }) => item);
}

function fecharTodosDropdowns() {
  document.querySelectorAll(".autocomplete-dropdown").forEach(d => d.remove());
}

function montarDropdown(sugestoes, campo, onSelecionar) {
  fecharTodosDropdowns();
  if (sugestoes.length === 0) return;

  const dropdown = criar("div", "autocomplete-dropdown");
  dropdown.setAttribute("role", "listbox");

  sugestoes.forEach((item, idx) => {
    const opcao = criar("div", "autocomplete-item");
    opcao.setAttribute("role", "option");
    opcao.dataset.idx = idx;

    const codigo = criar("span", "autocomplete-codigo", item.codigo);
    const nomeEl = document.createElement("span");
    nomeEl.className = "autocomplete-nome";
    if (item.apelido) {
      nomeEl.appendChild(document.createTextNode(item.nome + " "));
      const seta = document.createElement("i");
      seta.className = "fa-solid fa-arrow-right autocomplete-seta";
      nomeEl.appendChild(seta);
      nomeEl.appendChild(document.createTextNode(" " + item.apelido));
    } else {
      nomeEl.textContent = item.nome;
    }
    opcao.appendChild(codigo);
    opcao.appendChild(nomeEl);

    opcao.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onSelecionar(item.codigo);
    });

    dropdown.appendChild(opcao);
  });

  campo.parentNode.style.position = "relative";
  campo.parentNode.appendChild(dropdown);
}

function configurarAutocomplete(campo, chaveLista, onSelecionar) {
  let idxAtivo = -1;

  campo.addEventListener("input", () => {
    idxAtivo = -1;
    if (erroCarregamentoBanco) { fecharTodosDropdowns(); return; }
    const termo = campo.value;
    if (!termo.trim() || !termo.replace(/[\s\-*]+/g, "")) { fecharTodosDropdowns(); return; }
    const sugestoes = buscarSugestoes(banco[chaveLista], termo);
    montarDropdown(sugestoes, campo, onSelecionar);
  });

  campo.addEventListener("keydown", (e) => {
    const dropdown = campo.parentNode.querySelector(".autocomplete-dropdown");
    if (!dropdown) return;
    const itens = dropdown.querySelectorAll(".autocomplete-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      idxAtivo = Math.min(idxAtivo + 1, itens.length - 1);
      itens.forEach((el, i) => el.classList.toggle("ativo", i === idxAtivo));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      idxAtivo = Math.max(idxAtivo - 1, -1);
      itens.forEach((el, i) => el.classList.toggle("ativo", i === idxAtivo));
    } else if (e.key === "Enter" && idxAtivo >= 0) {
      e.preventDefault();
      onSelecionar(itens[idxAtivo].querySelector(".autocomplete-codigo").textContent);
    } else if (e.key === "Escape") {
      fecharTodosDropdowns();
    }
  });

  campo.addEventListener("blur", () => {
    setTimeout(fecharTodosDropdowns, 150);
  });
}

function itemBateComTermo(item, termo) {
  const t = normalizarBusca(termo);
  return item._textoCompletoBusca ? item._textoCompletoBusca.includes(t) : false;
}

// Foto ampliada

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
    }, 100);
  };

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
    setTimeout(() => modal.remove(), 180);
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

function montarImagens(item) {
  if (!("imagem" in item)) return null;

  const bloco = criar("div", "item-imagens");

  const montarFoto = (srcBruto, legenda) => {
    const legLimpa = (legenda || "").trim();
    const listaFotos = String(srcBruto || "")
      .split("|")
      .map(s => s.trim())
      .filter(s => s !== "" && !s.includes("NO-PHOTO"));

    const srcInicial = listaFotos.length > 0 ? listaFotos[0] : NO_PHOTO;

    const caixa = criar("div", "foto-wrap");
    const foto = document.createElement("img");
    foto.className = "foto-perfil";
    foto.alt = legLimpa;
    foto.loading = "lazy";
    foto.decoding = "async";
    foto.onerror = () => { foto.src = NO_PHOTO; };
    foto.src = srcInicial;
    foto.addEventListener("click", () => {
      if (!foto.src.includes("NO-PHOTO")) {
        const galeriaIndividual = listaFotos.map((s, idx) => ({
          src: s,
          leg: `${legLimpa}${listaFotos.length > 1 ? " (" + (idx + 1) + "/" + listaFotos.length + ")" : ""}`
        }));
        abrirFoto(galeriaIndividual, legLimpa, 0);
      }
    });
    const texto = criar("span", "foto-legenda", legLimpa);
    caixa.appendChild(foto);
    caixa.appendChild(texto);
    return caixa;
  };

  // Lado Esquerdo (Origem - 1 ou mais itens separados por "+")
  const codigosOrig = String(item.codigo || "").split("+").map(s => s.trim()).filter(Boolean);
  const caminhosOrig = Array.isArray(item.imagem)
    ? item.imagem
    : String(item.imagem || "").split(",");

  codigosOrig.forEach((codOrig, i) => {
    const caminho = caminhosOrig[i] ? String(caminhosOrig[i]).trim() : (i === 0 ? String(item.imagem || "").trim() : "");
    bloco.appendChild(montarFoto(caminho, codOrig));
    if (i < codigosOrig.length - 1) {
      bloco.appendChild(criar("i", "fa-solid fa-plus foto-seta"));
    }
  });

  // Seta e Lado Direito (Substituição - 1 ou mais itens separados por "+")
  if (item.substituicao && item.substituicao !== "-") {
    bloco.appendChild(criar("i", "fa-solid fa-arrow-right foto-seta"));

    const codigosSub = String(item.substituicao).split("+").map(s => s.trim()).filter(Boolean);
    const caminhosSub = Array.isArray(item.imagem_sub)
      ? item.imagem_sub
      : String(item.imagem_sub || "").split(",");

    codigosSub.forEach((codigoSub, i) => {
      const caminho = caminhosSub[i] ? String(caminhosSub[i]).trim() : "";
      bloco.appendChild(montarFoto(caminho, codigoSub));
      if (i < codigosSub.length - 1) {
        bloco.appendChild(criar("i", "fa-solid fa-plus foto-seta"));
      }
    });
  }

  return bloco;
}

// Montar resultado
function montarItem(item, campos) {
  const bloco = criar("article", "item");

  const imgs = montarImagens(item);
  if (imgs) bloco.appendChild(imgs);

  const lista = criar("dl");

  if (item.codigo && item.codigo.includes("+")) {
    lista.appendChild(criar("dt", "", "Conjunto substituído"));
    lista.appendChild(criar("dd", "conjunto-origem", item.codigo));
  }

  campos.forEach(([chave, rotulo, destaque]) => {
    if (!item[chave]) return;
    lista.appendChild(criar("dt", "", rotulo));
    const dd = criar("dd", destaque ? "destaque" : "");

    if (destaque) {
      dd.textContent = item[chave];
      if (item[chave] && item[chave] !== "-") {
        const btnCopiar = criar("button", "btn-copiar");
        btnCopiar.type = "button";
        btnCopiar.title = "Copiar código";
        btnCopiar.innerHTML = '<i class="fa-regular fa-copy"></i>';
        btnCopiar.addEventListener("click", () => {
          navigator.clipboard.writeText(item[chave]).then(() => {
            btnCopiar.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => { btnCopiar.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1500);
          });
        });
        dd.appendChild(btnCopiar);
      }
    } else {
      if (typeof item[chave] === "string" && item[chave].includes("||")) {
        dd.innerHTML = item[chave].split("||").join("<br>");
      } else {
        dd.textContent = item[chave];
      }
    }
    lista.appendChild(dd);
  });
  bloco.appendChild(lista);
  return bloco;
}

// Painel
function configurarPainel(idPainel, chaveLista, campos, chaveHistorico) {
  const painel = document.getElementById(idPainel);
  if (!painel) return;
  const form = painel.querySelector("form");
  const campo = painel.querySelector("input");
  const limpar = painel.querySelector(".btn-limpar");
  const resultado = painel.querySelector(".resultado");

  renderizarHistorico(chaveHistorico, campo, resultado);

  // Se o banco não estiver sido carregado, exibe o aviso imediatamente ao abrir a página
  if (erroCarregamentoBanco) {
    exibirErroBanco(resultado);
  }

  const selecionar = (codigo) => {
    campo.value = codigo;
    fecharTodosDropdowns();
    form.requestSubmit();
  };

  configurarAutocomplete(campo, chaveLista, selecionar);

  form.onsubmit = (e) => {
    e.preventDefault();
    fecharTodosDropdowns();
    const digitado = campo.value.trim();

    // Se o banco não carregou, mostre o aviso de erro de banco ao pesquisar!
    if (erroCarregamentoBanco) {
      limpar.hidden = !digitado;
      exibirErroBanco(resultado);
      return;
    }

    if (!digitado) return;

    const codigo = normalizar(digitado);
    resultado.replaceChildren();
    limpar.hidden = false;

    const listaBase = banco[chaveLista] || [];
    const exatos = listaBase.filter(i => codigoBateExato(i, codigo));

    if (exatos.length > 0) {
      salvarHistorico(chaveHistorico, exatos[0].codigo);
      renderizarHistorico(chaveHistorico, campo, resultado);
      resultado.appendChild(criar("span", "status ok", "Código encontrado"));
      exatos.forEach(item => resultado.appendChild(montarItem(item, campos)));
      return;
    }

    const porTermo = listaBase.filter(i => itemBateComTermo(i, digitado));

    if (porTermo.length > 0) {
      const label = porTermo.length === 1
        ? "1 resultado encontrado"
        : `${porTermo.length} resultados para "${digitado}"`;
      resultado.appendChild(criar("span", "status ok", label));
      porTermo.forEach(item => resultado.appendChild(montarItem(item, campos)));
      return;
    }

    resultado.appendChild(criar("span", "status erro", "Código não encontrado"));
    const msg = criar("p", "msg-erro", "Nenhuma substituição para ");
    msg.appendChild(criar("strong", "", `"${codigo}"`));
    msg.appendChild(document.createTextNode(". Confira o código e tente novamente."));
    resultado.appendChild(msg);
  };

  limpar.onclick = () => {
    campo.value = "";
    limpar.hidden = true;
    fecharTodosDropdowns();
    if (erroCarregamentoBanco) {
      exibirErroBanco(resultado);
    } else {
      resultado.replaceChildren();
    }
    campo.focus();
  };
}

// Relógio
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

// Temas ESCURO ou CLARO
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
  aplicar(salvo ? salvo === "escuro" : false);

  if (btn) btn.addEventListener("click", () => aplicar(!temaEscuro()));
}

async function iniciar() {
  iniciarTema();
  atualizarRelogio();
  setInterval(atualizarRelogio, 30000);

  try {
    const resposta = await fetch("http://127.0.0.1:5000/api/substituicoes");
    if (!resposta.ok) throw new Error("Erro na API");
    const dados = await resposta.json();
    if (!dados || ((!dados.perfis || dados.perfis.length === 0) && (!dados.acessorios || dados.acessorios.length === 0))) {
      throw new Error("Banco vazio ou sem conexão com o Notion");
    }
    banco = dados;
    erroCarregamentoBanco = false;
    indexarBancoSubstituicoes();
  } catch {
    erroCarregamentoBanco = true;
  }

  const contador = document.getElementById("contador-banco");
  if (contador) {
    if (!erroCarregamentoBanco) {
      contador.textContent = `${(banco.perfis || []).length} perfis e ${(banco.acessorios || []).length} acessórios cadastrados!`;
    } else {
      contador.textContent = "";
    }
  }

  configurarPainel("painel-perfis", "perfis", CAMPOS_PERFIS, HISTORICO_KEY_PERFIS);
  configurarPainel("painel-acessorios", "acessorios", CAMPOS_ACESSORIOS, HISTORICO_KEY_ACESSORIOS);
}

iniciar();