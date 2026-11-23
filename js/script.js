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

// "Gold -> Chroma" vira dois selos quadrados, cada um com o contorno na cor do catálogo do sistema
function selosDoSistema(el, texto) {
  String(texto).split(/\s*->\s*/).forEach((nome, i) => {
    if (i) el.appendChild(criar("i", "fa-solid fa-arrow-right seta-conversao"));
    const selo = criar("span", "selo-sistema", nome);
    const sis = (banco.sistemas || []).find(s => normalizarBusca(s.nome) === normalizarBusca(nome) || normalizarBusca(s.chave) === normalizarBusca(nome));
    if (sis && sis.cor) selo.style.setProperty("--cor-sistema", sis.cor);
    el.appendChild(selo);
  });
}

// exemplo do campo de busca: um código qualquer cadastrado (muda a cada vez que abre a página)
function sortearExemplos() {
  [["codigo-perfis", banco.perfis], ["codigo-acessorios", banco.acessorios]].forEach(([id, lista]) => {
    const campo = document.getElementById(id);
    const codigos = (lista || []).map(i => i.codigo).filter(c => c && !c.includes("+"));
    if (campo && codigos.length) campo.placeholder = `Ex: ${codigos[Math.floor(Math.random() * codigos.length)]}`;
  });
}

const HISTORICO_KEY_PERFIS = "historico_perfis";
const HISTORICO_KEY_ACESSORIOS = "historico_acessorios";
const NO_PHOTO = "assets/img/substitution/NO-PHOTO.webp";
const SUGESTOES_MAX = 6;

let banco = { perfis: [], acessorios: [] };
let erroCarregamentoBanco = false;
let fichasCatalogo = {}; // código normalizado -> onde ele está no catálogo (pros botões de ficha completa)

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
    item._sistemaBusca = normalizarBusca(item.sistema || "");
    item._textoCompletoBusca = [
      item.codigo, item.substituicao, item.nome, item.apelido, item.observacao, item.sistema, item.tipo
    ].filter(Boolean).map(v => normalizarBusca(v)).join(" ");
  });
}

function substitutoBateExato(item, codigoDigitadoNorm) {
  return String(item.substituicao || "").split(/[+\/]| ou /i).some(p => normalizar(p) === codigoDigitadoNorm);
}

async function carregarFichasCatalogo() {
  try {
    const resposta = await fetch(`${API_URL}/api/catalogo/codigos`);
    if (!resposta.ok) return;
    (await resposta.json()).forEach(c => {
      const norm = normalizar(c.codigo);
      if (!fichasCatalogo[norm]) fichasCatalogo[norm] = c;
    });
  } catch { /* sem a lista só não aparecem os botões de ficha */ }
}

function linkFicha(codigo) {
  const ficha = fichasCatalogo[normalizar(codigo)];
  if (!ficha) return null;
  const link = criar("a", "btn-ficha-completa");
  link.href = `catalogo.html?codigo=${encodeURIComponent(ficha.codigo)}&sistema=${encodeURIComponent(ficha.sistema)}&aba=${ficha.aba}`;
  link.innerHTML = '<i class="fa-solid fa-book-open"></i> ';
  link.appendChild(document.createTextNode(`Ficha completa do ${ficha.codigo}`));
  return link;
}

function botoesFicha(codigos) {
  const links = [...new Set(codigos)].map(linkFicha).filter(Boolean);
  if (!links.length) return null;
  const linha = criar("div", "fichas-acoes");
  links.forEach(l => linha.appendChild(l));
  return linha;
}

function codigoBateExato(item, codigoDigitadoNorm) {
  if (!item || !codigoDigitadoNorm) return false;
  if (item._codNorm === codigoDigitadoNorm) return true;
  return Array.isArray(item._partesCodNorm) && item._partesCodNorm.includes(codigoDigitadoNorm);
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

  let codigosOrig = String(item.codigo || "").split("+").map(s => s.trim()).filter(Boolean);
  const caminhosOrig = Array.isArray(item.imagem)
    ? item.imagem
    : String(item.imagem || "").split(",");
  // conjunto com uma foto só (ex: VT1901+SPH001.png): mostra uma imagem com o conjunto todo
  if (codigosOrig.length > 1 && caminhosOrig.filter(c => String(c).trim()).length === 1) {
    codigosOrig = [codigosOrig.join(" + ")];
  }

  codigosOrig.forEach((codOrig, i) => {
    const caminho = caminhosOrig[i] ? String(caminhosOrig[i]).trim() : (i === 0 ? String(item.imagem || "").trim() : "");
    bloco.appendChild(montarFoto(caminho, codOrig));
    if (i < codigosOrig.length - 1) {
      bloco.appendChild(criar("i", "fa-solid fa-plus foto-seta"));
    }
  });

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
        textoComQuebras(dd, item[chave]);
      } else if (chave === "sistema") {
        selosDoSistema(dd, item[chave]);
      } else if (typeof item[chave] === "string" && item[chave].includes("->")) {
        textoComSeta(dd, item[chave]);
      } else {
        dd.textContent = item[chave];
      }
    }
    lista.appendChild(dd);
  });
  bloco.appendChild(lista);

  // atalho pra ficha completa no catálogo, tanto do que saiu quanto do que entra no lugar
  const separar = texto => String(texto || "").split(/[+\/]| ou /i).map(s => s.trim()).filter(s => s && s !== "-");
  const fichas = botoesFicha([...separar(item.codigo), ...separar(item.substituicao)]);
  if (fichas) bloco.appendChild(fichas);
  return bloco;
}

function configurarPainelConversao() {
  const btnGoldChroma = document.getElementById("btn-conv-gold-chroma");
  const containerLista = document.getElementById("lista-conversao-container");
  const painelPerfis = document.getElementById("painel-perfis");

  if (!btnGoldChroma || !containerLista || !painelPerfis) return;

  const obterItensGoldChroma = () => {
    return (banco.perfis || []).filter(item => {
      const sisNorm = normalizarBusca(item.sistema || "");
      return sisNorm.includes("gold") && sisNorm.includes("chroma");
    });
  };

  const renderizarItensConversao = (filtro = "") => {
    const scrollBox = containerLista.querySelector(".conversao-itens-scroll");
    if (!scrollBox) return;
    scrollBox.replaceChildren();

    const listaGold = obterItensGoldChroma();
    const termo = normalizarBusca(filtro);
    const filtrados = listaGold.filter(item => {
      if (!termo) return true;
      return normalizarBusca(item.codigo).includes(termo) || normalizarBusca(item.substituicao).includes(termo);
    });

    if (filtrados.length === 0) {
      const msgVazio = criar("p", "msg-erro", "Nenhum perfil Gold encontrado.");
      msgVazio.style.fontSize = "0.8rem";
      msgVazio.style.padding = "0.4rem";
      scrollBox.appendChild(msgVazio);
      return;
    }

    filtrados.forEach(item => {
      const btnLinha = criar("button", "conversao-item-linha");
      btnLinha.type = "button";

      const spanOrig = criar("span", "conversao-cod-gold", item.codigo);
      const iconeSeta = criar("i", "fa-solid fa-arrow-right conversao-seta-item");
      const semSub = !item.substituicao || item.substituicao === "-";
      const spanDest = criar("span", "conversao-cod-chroma" + (semSub ? " sem-sub" : ""));

      if (semSub) {
        spanDest.innerHTML = '<i class="fa-solid fa-ban"></i> Sem subst.';
      } else {
        spanDest.textContent = item.substituicao;
      }

      btnLinha.appendChild(spanOrig);
      btnLinha.appendChild(iconeSeta);
      btnLinha.appendChild(spanDest);

      btnLinha.addEventListener("click", () => {
        scrollBox.querySelectorAll(".conversao-item-linha").forEach(el => el.classList.remove("selecionado"));
        btnLinha.classList.add("selecionado");

        const inputPerfis = painelPerfis.querySelector("input");
        const formPerfis = painelPerfis.querySelector("form");
        if (inputPerfis && formPerfis) {
          inputPerfis.value = item.codigo;
          formPerfis.requestSubmit();
        }
      });

      scrollBox.appendChild(btnLinha);
    });
  };

  btnGoldChroma.addEventListener("click", () => {
    const aberto = !containerLista.hidden;
    if (aberto) {
      containerLista.hidden = true;
      btnGoldChroma.classList.remove("ativo");
      return;
    }

    btnGoldChroma.classList.add("ativo");
    containerLista.hidden = false;
    containerLista.replaceChildren();

    const wrapBusca = criar("div", "conversao-busca-wrap");
    wrapBusca.appendChild(criar("i", "fa-solid fa-magnifying-glass conversao-busca-icone"));
    const inputFiltro = document.createElement("input");
    inputFiltro.type = "text";
    inputFiltro.className = "conversao-filtro-input";
    inputFiltro.placeholder = "Filtrar Gold ou Chroma...";
    inputFiltro.addEventListener("input", () => renderizarItensConversao(inputFiltro.value));
    wrapBusca.appendChild(inputFiltro);

    const cabTabela = criar("div", "conversao-cabecalho-tabela");
    const colEsq = criar("span", "");
    colEsq.innerHTML = '<i class="fa-solid fa-layer-group"></i> Gold';
    const colDir = criar("span", "");
    colDir.innerHTML = '<i class="fa-solid fa-cube"></i> Chroma';
    cabTabela.appendChild(colEsq);
    cabTabela.appendChild(colDir);

    const scrollBox = criar("div", "conversao-itens-scroll");

    containerLista.appendChild(wrapBusca);
    containerLista.appendChild(cabTabela);
    containerLista.appendChild(scrollBox);

    renderizarItensConversao("");
  });
}

function configurarPainel(idPainel, chaveLista, campos, chaveHistorico) {
  const painel = document.getElementById(idPainel);
  if (!painel) return;
  const form = painel.querySelector("form");
  const campo = painel.querySelector("input");
  const limpar = painel.querySelector(".btn-limpar");
  const resultado = painel.querySelector(".resultado");

  renderizarHistorico(chaveHistorico, campo, resultado);

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
      gravarHistorico(chaveHistorico, exatos[0].codigo);
      renderizarHistorico(chaveHistorico, campo, resultado);
      resultado.appendChild(criar("span", "status ok", "Código encontrado"));
      exatos.forEach(item => resultado.appendChild(montarItem(item, campos)));
      return;
    }

    // digitou o código novo (o substituto): mostra só quem ele substitui, sem misturar com a busca por texto
    const substituidos = listaBase.filter(i => substitutoBateExato(i, codigo));
    if (substituidos.length > 0) {
      gravarHistorico(chaveHistorico, digitado.toUpperCase());
      renderizarHistorico(chaveHistorico, campo, resultado);
      const qtd = substituidos.length === 1 ? "1 código" : `${substituidos.length} códigos`;
      resultado.appendChild(criar("span", "status ok", `${digitado.toUpperCase()} substitui ${qtd}`));
      substituidos.forEach(item => resultado.appendChild(montarItem(item, campos)));
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
    msg.appendChild(criar("strong", "", `"${digitado.toUpperCase()}"`));
    const temFicha = linkFicha(digitado);
    msg.appendChild(document.createTextNode(temFicha
      ? ". Ele está no catálogo, mas não tem substituição cadastrada. Veja a ficha completa:"
      : ". Confira o código e tente novamente."));
    resultado.appendChild(msg);
    if (temFicha) {
      const linha = criar("div", "fichas-acoes");
      linha.appendChild(temFicha);
      resultado.appendChild(linha);
    }
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

async function iniciar() {
  iniciarTema();
  iniciarRelogio();

  try {
    banco = await carregarBanco("/api/substituicoes");
    indexarBancoSubstituicoes();
    sortearExemplos();
    await carregarFichasCatalogo();
  } catch {
    erroCarregamentoBanco = true;
  }

  const contador = document.getElementById("contador-banco");
  if (contador && !erroCarregamentoBanco) {
    contador.textContent = `${(banco.perfis || []).length} perfis e ${(banco.acessorios || []).length} acessórios cadastrados!`;
  }

  configurarPainelConversao();
  configurarPainel("painel-perfis", "perfis", CAMPOS_PERFIS, HISTORICO_KEY_PERFIS);
  configurarPainel("painel-acessorios", "acessorios", CAMPOS_ACESSORIOS, HISTORICO_KEY_ACESSORIOS);

  // veio do catálogo com ?codigo=... -> já pesquisa no painel certo
  const codigoUrl = new URLSearchParams(location.search).get("codigo");
  if (codigoUrl && !erroCarregamentoBanco) {
    const norm = normalizar(codigoUrl);
    const ehAcessorio = !banco.perfis.some(i => codigoBateExato(i, norm)) && banco.acessorios.some(i => codigoBateExato(i, norm));
    const painel = document.getElementById(ehAcessorio ? "painel-acessorios" : "painel-perfis");
    painel.querySelector("input").value = codigoUrl;
    painel.querySelector("form").requestSubmit();
    painel.scrollIntoView({ block: "start" });
  }
}

iniciar();
