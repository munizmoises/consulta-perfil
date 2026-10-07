# Changelog

**v1.2.0** — 07/10/2026

### 🚀 Adicionado
- Campo **nome** nos resultados de pesquisa (perfis e acessórios).
- Histórico das últimas 5 pesquisas por painel guardado via `localStorage` (com pílulas clicáveis).
- Sistema de imagens para perfis (original e substituto, com suporte a fallback `NO-PHOTO`).
- Campo `imagem_sub` na estrutura do `banco.json`.

### 🔄 Modificado / Melhorias
- Legendas das fotografias agora mostram os códigos exatos dos perfis em vez dos rótulos genéricos ("Original" / "Substituto").
- Relógio do sistema agora atualiza dinamicamente a cada 60 segundos.
- Novos estilos CSS para o histórico de pesquisas e galeria visual dos perfis (`foto-wrap`, `foto-perfil`, `foto-seta`, `foto-legenda`).

### 📌 Planejado

**Fase 1 — Essenciais**
- [ ] Autocomplete com sugestões ao digitar
- [ ] Copiar resultado formatado com 1 clique
- [ ] Busca automática ao preencher o código exato
- [x] Botões de pesquisar e limpar

**Fase 2 — Refinamento & UI**
- [x] Campo inteligente que ignora maiúsculas, espaços e hífens
- [ ] Alternância para Modo Claro
- [ ] Tags visuais no card (badges coloridos por sistema, acabamento, etc.)

**Fase 3 — Persistência Local**
- [x] Histórico das 5 últimas pesquisas
- [ ] Contador total de consultas realizadas (`localStorage`)
- [ ] Lista de favoritos com estrela
- [ ] Top consultas (ranking dos mais pesquisados)

**Fase 4 — Compartilhamento**
- [ ] Link compartilhável (ex: `?codigo=CHR120`) para abrir já com o resultado
- [ ] Exportação de relatório em texto e PDF
- [ ] Painel de status no rodapé (total de perfis, acessórios cadastrados, data de atualização do banco e versão)

**Fase 5 — Arquitetura & Sistema (Futuro)**
- [ ] Login por matrícula
- [ ] Integração com backend em Python (Flask)
- [ ] Portal administrativo para gestão do banco de dados

---

**v1.1.0** — 06/10/2026

### 🚀 Adicionado
- Estrutura base para o histórico de pesquisas.
- Relógio na interface.

### 🔄 Modificado / Corrigido
- Ajustes de layout, espaçamentos e cores no tema escuro.

---

**v1.0.0** — 03/10/2026

### 🚀 Adicionado
- Estrutura inicial do projeto.
- Banco de dados em JSON com os primeiros itens.
- Pesquisa por código de perfil e exibição das substituições correspondentes.