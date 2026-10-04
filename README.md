# Consulta Perfil

Site para consultar possíveis substituições de perfis de alumínio, acessórios e componentes. Você digita o código e ele mostra na hora por qual código dá para trocar.

**Acesse o site:** [Consulta Perfil](https://munizmoises.github.io/consulta-perfil/)

![Tela inicial do Consulta Perfil](assets/img/prints/tela-inicial.png)

## Por que eu fiz?

Trabalho com vendas e lido todo dia com perfis de alumínio. São muitos itens e muitos códigos, e ninguém consegue lembrar tudo de cabeça. Quando um perfil não está disponível, era preciso procurar num bloco de notas qual outro serviria no lugar.

Eu já tinha montado uma planilha de Excel para isso com PROCX, e ela ajudou bastante. O problema é que, com vários usuários na mesma planilha online, todo mundo acabava mexendo nas mesmas células ao mesmo tempo.

Então peguei essa ideia e transformei em um site: cada pessoa consulta no seu computador, sem editar nada e sem atrapalhar ninguém.

## O que ele faz?

O site tem duas colunas de pesquisa:

- **Perfis:** para perfis de alumínio.
- **Acessórios:** para acessórios e componentes. Eles têm diferenças entre si, mas deixei os dois juntos na mesma consulta para ficar simples.

Ao pesquisar um código, o resultado mostra:

**Perfis**
- **Substituição:** o código que pode ser usado no lugar
- **Observação:** detalhes importantes, como acabamento ou cor
- **Sistema:** a linha de perfis a que o item pertence

**Acessórios**
- **Substituição:** o código que pode ser usado no lugar
- **Observação:** detalhes importantes
- **Tipo** e **Unidade de conversão:** só aparecem quando o item tem essas informações

A pesquisa ignora hífen e maiúsculas/minúsculas, então `GUI-004`, `gui004` e `GUI004` encontram o mesmo item.

Exemplo de perfil:

```text
Código: CHR004

Substituição: CHR120
Observação:   FOSCO (FO23)
Sistema:      Chroma
```

Exemplo de acessório:

```text
Código: GUI-004

Substituição: -
Observação:   Sem observação
Tipo:         PACOTE
Und. conv.:   8 PEÇAS
```

O uso na empresa é no computador, mas o layout é responsivo e se ajusta a telas menores, como a do celular. A data e a hora ficam no topo da tela.

## Como foi feito

Escolhi começar simples, sem banco de dados e sem servidor:

- HTML, CSS e JavaScript puro
- Um arquivo JSON (`banco.json`) com todos os itens
- Hospedagem gratuita no GitHub Pages

Quando a página abre, o JavaScript carrega o `banco.json` e procura o código digitado. Não precisa de mais nada para funcionar.

## Tecnologias

**v1.0**
- HTML
- CSS
- JavaScript

**Futuro**
- Bootstrap
- Python
- Flask

## Estrutura

```text
consulta-perfil/
├── index.html
├── style.css
├── script.js
├── banco.json
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── img/
├── README.md
└── CHANGELOG.md
```

## Como atualizar os dados

Tudo fica no `banco.json`, separado em `perfis` e `acessorios`. Perfis seguem este formato:

```json
{
  "codigo": "CHR004",
  "substituicao": "CHR120",
  "observacao": "FOSCO (FO23)",
  "sistema": "Chroma"
}
```

Acessórios não têm sistema. Os campos `tipo` e `unidade_conversao` são opcionais e só precisam ser incluídos nos itens que tiverem essas informações:

```json
{
  "codigo": "GUI-004",
  "substituicao": "-",
  "observacao": "Sem observação",
  "tipo": "PACOTE",
  "unidade_conversao": "8 PEÇAS"
}
```

## Versão atual

**v1.1.1** — 03/10/2026

### Adicionado
- Estrutura inicial do projeto
- Banco de dados em JSON
- Pesquisa por código
- Exibição de substituições

### Planejado
- Modo claro
- Histórico de pesquisas
- Botão de copiar resultado
- Login por matrícula
- Backend com Python e Flask
- Portal administrativo

O histórico completo está no [CHANGELOG](CHANGELOG.md).

## Autor

**Moisés Muniz**

Estudante de Ciência da Computação. Veja meus outros projetos no [portfólio](https://munizmoises.github.io/portfolio/).