const versao_atual = '2.0.1';

document.querySelectorAll('.versao_atual').forEach(el => el.innerHTML = versao_atual);

const CAMPOS_PERFIS = [
  ["substituicao", "Substituição", true],
  ["nome", "Nome"],
  ["apelido", "Apelido popular"],
  ["observacao", "Observação"],
  ["sistema", "Sistema"],
];

const CAMPOS_ACESSORIOS = [
  ["substituicao", "Substituição", true],
  ["nome", "Nome"],
  ["apelido", "Apelido popular"],
  ["observacao", "Observação"],
  ["tipo", "Tipo"],
  ["unidade_conversao", "Unidade de conversão"],
];

const HISTORICO_MAX = 5;
const HISTORICO_KEY_PERFIS = "historico_perfis";
const HISTORICO_KEY_ACESSORIOS = "historico_acessorios";
const NO_PHOTO = "assets/img/fotos/NO-PHOTO.webp";
const SUGESTOES_MAX = 6;

let banco = { perfis: [], acessorios: [] };

function normalizar(texto) {
  return texto.trim().toUpperCase().replace(/[\s\-*]+/g, "");
}

function normalizarBusca(texto) {
  return texto.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .replace(/[\s\-*]+/g, "");
}

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Histórico

function lerHistorico(chave) {
  try { return JSON.parse(localStorage.getItem(chave)) || []; }
  catch { return []; }
}

function salvarHistorico(chave, codigo) {
  let hist = lerHistorico(chave);
  hist = hist.filter(c => c !== codigo);
  hist.unshift(codigo);
  if (hist.length > HISTORICO_MAX) hist = hist.slice(0, HISTORICO_MAX);
  localStorage.setItem(chave, JSON.stringify(hist));
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
    localStorage.removeItem(chave);
    bloco.remove();
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
  if (!termo || termo.length < 1) return [];
  const t = normalizarBusca(termo);

  const score = (item) => {
    const cod = normalizarBusca(item.codigo);
    const nome = normalizarBusca(item.nome || "");
    const apelido = normalizarBusca(item.apelido || "");
    const obs = normalizarBusca(item.observacao || "");

    if (cod.startsWith(t)) return 1;
    if (nome.startsWith(t) || apelido.startsWith(t)) return 2;
    if (cod.includes(t) || nome.includes(t) || apelido.includes(t) || obs.includes(t)) return 3;
    return 99;
  };

  return lista
    .map(item => ({ item, s: score(item) }))
    .filter(({ s }) => s < 99)
    .sort((a, b) => a.s - b.s || a.item.codigo.localeCompare(b.item.codigo))
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
    const nome = nomeEl;
    opcao.appendChild(codigo);
    opcao.appendChild(nome);

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
  return [item.codigo, item.nome, item.apelido, item.observacao, item.sistema, item.tipo]
    .some(v => v && normalizarBusca(v).includes(t));
}

// Imagens

function montarImagens(item) {
  if (!("imagem" in item)) return null;

  const bloco = criar("div", "item-imagens");

  const montarFoto = (src, legenda) => {
    const caixa = criar("div", "foto-wrap");
    const foto = document.createElement("img");
    foto.className = "foto-perfil";
    foto.alt = legenda.trim();
    foto.loading = "lazy";
    foto.onerror = () => { foto.src = NO_PHOTO; };
    foto.src = src && src.trim() !== "" ? src : NO_PHOTO;
    const texto = criar("span", "foto-legenda", legenda.trim());
    caixa.appendChild(foto);
    caixa.appendChild(texto);
    return caixa;
  };

  bloco.appendChild(montarFoto(item.imagem, item.codigo));

  if (item.imagem_sub && item.substituicao && item.substituicao !== "-") {
    bloco.appendChild(criar("i", "fa-solid fa-arrow-right foto-seta"));

    const codigosSub = item.substituicao.split("+");
    const caminhosSub = item.imagem_sub.split(",");

    codigosSub.forEach((codigo, i) => {
      const caminho = caminhosSub[i] ? caminhosSub[i].trim() : "";
      bloco.appendChild(montarFoto(caminho, codigo));
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
      // Para separar as linhas no banco.json é só usar o "||" para quebrar as linhas.
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
  const form = painel.querySelector("form");
  const campo = painel.querySelector("input");
  const limpar = painel.querySelector(".btn-limpar");
  const resultado = painel.querySelector(".resultado");

  renderizarHistorico(chaveHistorico, campo, resultado);

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
    if (!digitado) return;

    const codigo = normalizar(digitado);
    resultado.replaceChildren();
    limpar.hidden = false;

    const exatos = banco[chaveLista].filter(i => normalizar(i.codigo) === codigo);

    if (exatos.length > 0) {
      salvarHistorico(chaveHistorico, exatos[0].codigo);
      renderizarHistorico(chaveHistorico, campo, resultado);
      resultado.appendChild(criar("span", "status ok", "Código encontrado"));
      exatos.forEach(item => resultado.appendChild(montarItem(item, campos)));
      return;
    }

    // Busca por apelido (nome, observação ou sistema)
    const porTermo = banco[chaveLista].filter(i => itemBateComTermo(i, digitado));

    if (porTermo.length > 0) {
      const label = porTermo.length === 1
        ? "1 resultado encontrado"
        : `${porTermo.length} resultados para "${digitado}"`;
      resultado.appendChild(criar("span", "status ok", label));
      porTermo.forEach(item => resultado.appendChild(montarItem(item, campos)));
      return;
    }

    // Nada encontrado
    resultado.appendChild(criar("span", "status erro", "Código não encontrado"));
    resultado.appendChild(
      criar("p", "msg-erro", `Nenhuma substituição para "${codigo}". Confira o código e tente novamente.`)
    );
  };

  limpar.onclick = () => {
    campo.value = "";
    resultado.replaceChildren();
    limpar.hidden = true;
    fecharTodosDropdowns();
    campo.focus();
  };
}

// Data/Relógio

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
    btn.innerHTML = temaEscuro()
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }

  btn.addEventListener("click", () => aplicar(!temaEscuro()));
}

async function iniciar() {
  iniciarTema();
  atualizarRelogio();
  setInterval(atualizarRelogio, 60000);

  try {
    const resposta = await fetch("banco.json");
    banco = await resposta.json();
  } catch {
    document.querySelectorAll(".resultado").forEach(r => {
      r.appendChild(criar("p", "msg-erro", "Não foi possível carregar o banco de dados. Recarregue a página e tente novamente."));
    });
  }

  const contador = document.getElementById("contador-banco");
  if (contador) {
    contador.textContent = `${banco.perfis.length} perfis e ${banco.acessorios.length} acessórios  cadastrados! `;
  }

  configurarPainel("painel-perfis", "perfis", CAMPOS_PERFIS, HISTORICO_KEY_PERFIS);
  configurarPainel("painel-acessorios", "acessorios", CAMPOS_ACESSORIOS, HISTORICO_KEY_ACESSORIOS);
}

iniciar();