// Consulta Perfil v1.0.0

const CAMPOS = [
  ["substituicao", "Substituição", true],
  ["observacao", "Observação"],
  ["sistema", "Sistema"],
  ["tipo", "Tipo"],
  ["unidade_conversao", "Unidade de conversão"],
];

let banco = { perfis: [], acessorios: [] };

function normalizar(texto) {
  return texto.trim().toUpperCase().replace(/[\s\-]+/g, "");
}

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function montarItem(item) {
  const bloco = criar("article", "item");
  const lista = criar("dl");
  CAMPOS.forEach(([chave, rotulo, destaque]) => {
    if (!item[chave]) return; // campos opcionais só aparecem quando existem
    lista.appendChild(criar("dt", "", rotulo));
    lista.appendChild(criar("dd", destaque ? "destaque" : "", item[chave]));
  });
  bloco.appendChild(lista);

  return bloco;
}

function configurarPainel(idPainel, chaveLista) {
  const painel = document.getElementById(idPainel);
  const form = painel.querySelector("form");
  const campo = painel.querySelector("input");
  const limpar = painel.querySelector(".btn-limpar");
  const resultado = painel.querySelector(".resultado");

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
    resultado.appendChild(criar("span", "status ok", "Código encontrado"));
    achados.forEach((item) => resultado.appendChild(montarItem(item)));
  });

  limpar.addEventListener("click", () => {
    campo.value = "";
    resultado.replaceChildren();
    limpar.hidden = true;
    campo.focus();
  });
}

function atualizarRelogio() {
  const agora = new Date();
  document.getElementById("data-hora").textContent =
    agora.toLocaleDateString("pt-BR") +
    " · " +
    agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function iniciar() {
  atualizarRelogio();
  setInterval(atualizarRelogio, 30000);
  configurarPainel("painel-perfis", "perfis");
  configurarPainel("painel-acessorios", "acessorios");

  try {
    const resposta = await fetch("banco.json");
    banco = await resposta.json();
  } catch {
    document.querySelectorAll(".resultado").forEach((r) => {
      r.appendChild(criar("p", "msg-erro", "Não foi possível carregar o banco de dados!"));
    });
  }
}

iniciar();