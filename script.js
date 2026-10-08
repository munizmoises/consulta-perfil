const versao_atual = '1.4.0';

document.querySelectorAll('.versao_atual').forEach(el => el.innerHTML = versao_atual);

const CAMPOS_PERFIS = [
  ["substituicao", "Substituição", true],
  ["nome", "Nome"],
  ["observacao", "Observação"],
  ["sistema", "Sistema"],
];

const CAMPOS_ACESSORIOS = [
  ["substituicao", "Substituição", true],
  ["nome", "Nome"],
  ["observacao", "Observação"],
  ["tipo", "Tipo"],
  ["unidade_conversao", "Unidade de conversão"],
];

const HISTORICO_MAX = 5;
const HISTORICO_KEY_PERFIS = "historico_perfis";
const HISTORICO_KEY_ACESSORIOS = "historico_acessorios";
const NO_PHOTO = "assets/img/fotos/NO-PHOTO.webp";

let banco = { perfis: [], acessorios: [] };

function normalizar(texto) {
  return texto.trim().toUpperCase().replace(/[\s\-*]+/g, "");
}

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Histórico
function lerHistorico(chave){
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
  bloco.appendChild(criar("p", "historico-titulo", "Pesquisas recentes:"));

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

// Imagens
function montarImagens(item){
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

  // Só mostra substituição se houver substituição diferente de "-"
  if (item.imagem_sub && item.substituicao && item.substituicao !== "-") {
    bloco.appendChild(criar("i", "fa-solid fa-arrow-right foto-seta"));

    const codigosSub = item.substituicao.split("+");
    const caminhosSub = item.imagem_sub.split(",");

    codigosSub.forEach((codigo, i) => {
      const caminho = caminhosSub[i] ? caminhosSub[i].trim() : "";
      bloco.appendChild(montarFoto(caminho, codigo));

      // Coloca "+" entre as fotos mas não depois da última
      if (i < codigosSub.length - 1) {
        bloco.appendChild(criar("i", "fa-solid fa-plus foto-seta"));
      }
    });
  }

  return bloco;
}

// Montar resultado
function montarItem(item, campos){
  const bloco = criar("article", "item");

  // Imagens (só perfis)
  const imgs = montarImagens(item);
  if (imgs) bloco.appendChild(imgs);

  const lista = criar("dl");
  campos.forEach(([chave, rotulo, destaque]) => {
    if (!item[chave]) return;
    lista.appendChild(criar("dt", "", rotulo));
    lista.appendChild(criar("dd", destaque ? "destaque" : "", item[chave]));
  });
  bloco.appendChild(lista);
  return bloco;
}

// Configurar painel
function configurarPainel(idPainel, chaveLista, campos, chaveHistorico){
  const painel = document.getElementById(idPainel);
  const form = painel.querySelector("form");
  const campo = painel.querySelector("input");
  const limpar = painel.querySelector(".btn-limpar");
  const resultado = painel.querySelector(".resultado");

  renderizarHistorico(chaveHistorico, campo, resultado);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const codigo = normalizar(campo.value);
    resultado.replaceChildren();
    limpar.hidden = false;

    const achados = banco[chaveLista].filter((i) => normalizar(i.codigo) === codigo);

    if (achados.length === 0) {
      resultado.appendChild(criar("span", "status erro", "Código não encontrado"));
      resultado.appendChild(
        criar("p", "msg-erro", `Nenhuma substituição para "${codigo}". Confira o código e tente de novo.`)
      );
      return;
    }

    salvarHistorico(chaveHistorico, achados[0].codigo);
    renderizarHistorico(chaveHistorico, campo, resultado);

    resultado.appendChild(criar("span", "status ok", "Código encontrado"));
    achados.forEach((item) => resultado.appendChild(montarItem(item, campos)));
  });

  limpar.addEventListener("click", () => {
    campo.value = "";
    resultado.replaceChildren();
    limpar.hidden = true;
    campo.focus();
  });
}

// Relógio
function atualizarRelogio(){
  const agora = new Date();
  document.getElementById("data-hora").textContent =
    agora.toLocaleDateString("pt-BR") +
    " · " +
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function iniciar(){
  atualizarRelogio();
  setInterval(atualizarRelogio, 60000);

  try {
    const resposta = await fetch("banco.json");
    banco = await resposta.json();
  } catch {
    document.querySelectorAll(".resultado").forEach((r) => {
      r.appendChild(criar("p", "msg-erro", "Não foi possível carregar o banco de dados. Recarregue a página e tente novamente."));
    });
  }

  configurarPainel("painel-perfis", "perfis", CAMPOS_PERFIS, HISTORICO_KEY_PERFIS);
  configurarPainel("painel-acessorios", "acessorios", CAMPOS_ACESSORIOS, HISTORICO_KEY_ACESSORIOS);
}

iniciar();