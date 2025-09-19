# 📐 QA Indica — One-Pager do Projeto (Single Source of Truth)

---

## 🔹 Visão Geral

O **QA Indica** (anteriormente chamado de *QWay Referências* ou *QWay Indica*) é uma plataforma comunitária que permite à comunidade de QA:

- **Indicar** profissionais, empresas, cursos, comunidades e recursos educacionais
- **Apoiar** ou **criticar** essas indicações
- **Comentar** com transparência
- **Moderá-las**, promovendo um espaço auditável e confiável

O projeto é **aberto, auditável, colaborativo** e voltado à valorização do ecossistema de QA e tecnologia.

---

## 🔹 Objetivo

Criar a maior base comunitária de **referências positivas e negativas**, visível a todos e com **controle coletivo e transparente**, servindo como:

- Termômetro da comunidade
- Curadoria social de bons e maus exemplos
- Ferramenta de reconhecimento e alerta
- Base aberta para estudos, análises e futuras integrações

---

## 🔹 Arquitetura

### Frontend (React + Vite)

- Páginas: `Home`, `Referencias`, `Indicar`, `Recursos`, `Moderação`
- Estado: `React Hooks`, com evolução futura para Zustand ou Context API
- Comunicação: `fetch` para backend via REST
- Cache local com `localStorage` para referências, votos e comentários pendentes
- Design System interno:
  - Botões `btn-action`, bordas verdes em campos válidos
  - Modais consistentes e acessíveis
  - Componentes genéricos: `CampoTexto`, `CampoSelect`, `ListaCheckbox`

### Backend (Node + Express)

- Rotas REST para:
  - Criar referência
  - Votar/remover voto
  - Comentar/remover comentário
  - Listar árvore (`/arvore`) para evitar 404
- Integração com **GitHub API**:
  - `Contents API` para leitura/gravação
  - `Trees API` para navegação segura
- Persistência final = arquivos JSON no GitHub público
- Segurança:
  - GitHub PAT (token pessoal) em `.env`
  - Middleware de autenticação para voto/comentário

### Repositórios

- **Privado (`qway-indica-app`)**:
  - Código frontend e backend
  - CI/CD separado
- **Público (`qway-indica-dados`)**:
  ```
  referencias/
    positivas/
      pos-xxxx.json
      comentarios/
        pos-xxxx.json
      votos/
        pos-xxxx.json
    negativas/
      neg-xxxx.json
      comentarios/
        neg-xxxx.json
      votos/
        neg-xxxx.json
  ```

### Hospedagem

- **Frontend**: Hostinger (produção)
- **Backend**: mesmo ambiente de API utilizado no QWay Academy

---

## 🔹 Estratégia de Carregamento

- Listagem de arquivos via `GET /arvore` (Trees API com cache)
- Carregamento somente de arquivos confirmados (evita 404)
- Cada referência carrega:
  - JSON principal
  - Comentários vinculados
  - Votos vinculados
- Consistência eventual:
  - Itens criados localmente ficam em buffer (localStorage) até sincronizar
  - Retry automático para sincronização com GitHub

---

## 🔹 Modelos de Dados

### Referência

```json
{
  "id": "pos-0001",
  "natureza": "positiva",
  "tipoIndicacao": "educacao",
  "titulo": "Curso AutomatizaQA",
  "nome": "Nome do recurso",
  "empresaOuResponsavel": "Fulano Ltda",
  "tipo": "curso",
  "area": "QA",
  "especialidade": "Automação",
  "valor": "297.00",
  "descricao": "Curso completo de testes automatizados",
  "aspectosSelecionados": ["Didática", "Atualização"],
  "dataRegistro": "2025-09-17T15:45:00Z",
  "status": "pendente|aprovada|rejeitada"
}
```

### Comentário

```json
[
  {
    "autor": "Nome",
    "texto": "Comentário",
    "email": "email@dominio.com",
    "data": "19/09/2025, 10:22:45"
  }
]
```

### Voto

```json
[
  {
    "email": "email@dominio.com",
    "data": "19/09/2025, 10:22:45"
  }
]
```

---

## 🔹 UI & Design System

### Componentes Reutilizáveis

- `ReferenciaCard`
- `ReferenciaModal`
- `ComentariosModal`
- `Filtros`
- Campos genéricos: `CampoTexto`, `CampoSelect`, `ListaCheckbox`

### Handlers Padronizados (via `useReferenciasActions.ts`)

```ts
handleAbrirDetalhes(ref)
handleFecharDetalhes()
handleAbrirComentarios()
handleFecharComentarios()
handleComentar(refId, comentario)
handleRemoverComentario(refId, index)
handleApoiar(refId)
handleRemoverApoio(refId)
handleCopiarLink(refId)
handleFiltrosToggle()
handleAplicarFiltros()
handleLimparFiltros()
```

### UIState Centralizado

```ts
{
  referenciaSelecionada?: ReferenciaDetalhada;
  showComentarios: boolean;
  filtrosVisiveis: boolean;
  filtros: {
    tipoAtivo: "positivas" | "negativas" | null;
    filtroTipo: string | null;
    filtroStatus: "aprovada" | "pendente" | null;
    searchTerm: string;
  };
}
```

---

## 🔹 Segurança & Performance

- Tokens GitHub só no backend
- CORS restrito a domínios confiáveis
- Validação de inputs e limites de tamanho
- Login obrigatório para votar/comentar
- Apenas 1 voto por email (idempotente)
- Uso de `raw.githubusercontent.com` para leitura (sem cota)
- Cache de árvore e debounce de busca/filtros

---

## 🔹 Metodologia & Equipe

- **Single Source of Truth** = este README (One-Pager vivo)
- **Hackathon de 24h** dividido em **4 sprints de 6h** cada

  Cada dia do hackathon representa uma sprint de 6 dias. Ou seja, cada hora trabalhada será considerada como equivalente a 1 dia de sprint tradicional. A ideia é simular o avanço de um projeto completo em ritmo acelerado, representando 24 dias de trabalho concentrados em 24h reais, divididas em 4 sprints. A cada hora (1 “dia”), são realizados ciclos de desenvolvimento, testes, revisão e documentação.

- Registro de cada hora:
  - Neste documento
  - Em vídeo (para série/documentário)
- Papéis:

  | Função               | Responsável                    |
  |----------------------|-------------------------------|
  | Product Owner        | Daniel + ChatGPT              |
  | Solutions Architect  | ChatGPT (QWally)              |
  | Fullstack Developer  | ChatGPT (QWally)              |
  | QA Engineer          | ChatGPT (QWally)              |
  | Project Manager      | Daniel + ChatGPT              |
  | Marketing/Conteúdo   | Daniel + Trinus Studio        |

### Distribuição das Sprints

```
- **Sprint 1 (Dia 1 - 6h)**: Setup inicial, estrutura de arquivos, primeira referência criada, base da UI (cards e modais), estrutura inicial de backend.
- **Sprint 2 (Dia 2 - 6h)**: Integrações frontend-backend, fluxos principais de apoio, comentário e filtro; implementação do cache e estrutura `/arvore`.
- **Sprint 3 (Dia 3 - 6h)**: Tela de moderação, painel de logs, validações, tratamento de erros e autenticação.
- **Sprint 4 (Dia 4 - 6h)**: QA, testes manuais e automatizados, refinamento de UX/UI, produção de conteúdo para lançamento e deploy final.
```

---

## 🔹 Produto

- **Home**:
  - Ranking de referências
  - Últimos registros
  - Explicação + CTA para colaborar

- **Referencias**:
  - Cards positivos e negativos
  - Filtros por tipo, status, natureza e busca
  - Modal com detalhes
  - Comentários embutidos

- **Indicar**:
  - Formulário dinâmico
  - Campos variam por natureza/tipo
  - Feedback visual (bordas verdes)

- **Moderação**:
  - Painel de aprovação/rejeição
  - Logs de apoio e comentários

- **Recursos**:
  - Templates, ferramentas e materiais de apoio à comunidade QA

---

## 🔹 QA e Qualidade

- Testes automatizados:
  - Front: `Jest + React Testing Library`
  - Back: `Supertest`
- Testes manuais:
  - Casos de uso principais e edge cases (rede, duplicidade, erros)
- Critérios de aceitação:
  - Baseados em `CTFL` + `ISO/IEC/IEEE 29119`

---

## 🔹 Marketing & Lançamento

- Série de vídeos:

  1. Abertura: “O que um QA faz em 24h?”
  2. Bastidores: cada sprint com reflexões e desafios
  3. Encerramento: deploy + tour + convite à comunidade

- Temática de fundo:
  - **19/20 de Setembro** (Semana Farroupilha)
  - Frase guia: *“Sirvam nossas façanhas de modelo a toda a Terra”*

- Canais:
  - YouTube, Instagram, LinkedIn, Comunidade QWay

---

## 🔹 Backlog Detalhado

---

### 🧩 Épico 1 — Gestão de Referências

> Implementação de funcionalidades que permitam cadastro, visualização e moderação de referências positivas e negativas.

**User Stories:**

- US1.1: Como usuário, quero cadastrar uma nova referência com campos adaptáveis conforme o tipo e natureza.
- US1.2: Como usuário, quero visualizar referências divididas entre positivas e negativas em cards distintos.
- US1.3: Como usuário, quero filtrar referências por tipo, natureza, status e texto livre.
- US1.4: Como moderador, quero aprovar ou rejeitar referências pendentes.

**Tarefas Técnicas:**

- Estruturar pastas e arquivos JSON conforme padrão (positivas/negativas).
- Implementar formulário de indicação com campos dinâmicos.
- Criar sistema de moderação com painel e botões de ação.
- Carregar e renderizar referências no frontend com filtros aplicáveis.

---

### 🧩 Épico 2 — Interações da Comunidade

> Funcionalidades de voto, apoio, comentário e contadores, promovendo engajamento auditável.

**User Stories:**

- US2.1: Como usuário, quero comentar em uma referência e remover meu comentário se desejar.
- US2.2: Como usuário, quero apoiar ou remover meu apoio em uma referência.
- US2.3: Como usuário, quero ver o número de comentários e votos de cada referência.

**Tarefas Técnicas:**

- Criar `ComentariosModal` com formulário e lista embutida.
- Criar CRUD de votos e comentários no backend.
- Atualizar frontend para refletir contadores e interações.
- Validar estado de autenticação antes de permitir ações.

---

### 🧩 Épico 3 — Moderação

> Aprovação, rejeição e status de referências, com rastreabilidade dos votos e comentários.

**User Stories:**

- US3.1: Como moderador, quero ver uma lista de referências pendentes para avaliar.
- US3.2: Como moderador, quero registrar minha decisão (aprovação ou rejeição).
- US3.3: Como moderador, quero ver o histórico de votos e comentários de cada referência.

**Tarefas Técnicas:**

- Criar tela de moderação com filtros por status.
- Implementar atualização de status via backend.
- Incluir painel de auditoria com logs visíveis por ID.

---

### 🧩 Épico 4 — UI/UX

> Refactor de componentes, padronização visual e melhoria da experiência do usuário.

**User Stories:**

- US4.1: Como usuário, quero uma navegação fluida com feedback visual claro.
- US4.2: Como usuário, quero que formulários tenham validação e destaque de campos obrigatórios.
- US4.3: Como desenvolvedor, quero evitar duplicações e reaproveitar componentes.

**Tarefas Técnicas:**

- Refatorar componentes (`ReferenciaCard`, `Filtros`, `CampoSelect` etc.).
- Centralizar lógica de ações em `useReferenciasActions.ts`.
- Consolidar estado em `UIState` global.
- Aplicar padrão de botões, cores e mensagens.

---

### 🧩 Épico 5 — Segurança & Performance

> Validações, autenticação, estratégias contra sobrecarga e erro.

**User Stories:**

- US5.1: Como usuário, quero receber mensagens claras em caso de erro (404, forbidden, duplicado).
- US5.2: Como dev, quero proteger os endpoints e esconder tokens.
- US5.3: Como dev, quero evitar chamadas desnecessárias ao GitHub (rate-limit).

**Tarefas Técnicas:**

- Middleware de autenticação no backend.
- Uso do `.env` para tokens sensíveis.
- Implementar cache e retry no frontend.
- Criar rota `/arvore` com navegação segura.

---

### 🧩 Épico 6 — Infra & Deploy

> Organização de repositórios, hospedagem e automações de CI/CD.

**User Stories:**

- US6.1: Como dev, quero separar os repositórios de dados e código.
- US6.2: Como dev, quero publicar frontend no Hostinger e backend no ambiente do Academy.
- US6.3: Como dev, quero automações de deploy contínuo.

**Tarefas Técnicas:**

- Configurar `qway-indica-app` (privado) e `qway-indica-dados` (público).
- Configurar CI/CD com GitHub Actions.
- Armazenar e proteger variáveis em `.env`.

---

### 🧩 Épico 7 — QA

> Estratégias de validação manual e automatizada.

**User Stories:**

- US7.1: Como QA, quero validar fluxos de uso principais (indicar, votar, comentar, filtrar).
- US7.2: Como QA, quero que testes automatizados cubram funcionalidades essenciais.
- US7.3: Como time, quero garantir que o sistema resista a casos extremos (edge cases).

**Tarefas Técnicas:**

- Criar testes com `Jest` e `React Testing Library`.
- Testar backend com `Supertest`.
- Executar cenários manuais com casos de uso críticos.

---

### 🧩 Épico 8 — Marketing & Lançamento

> Divulgação, documentação e engajamento da comunidade.

**User Stories:**

- US8.1: Como responsável pelo marketing, quero gravar vídeos sobre cada sprint.
- US8.2: Como responsável pelo marketing, quero produzir artes, posts e CTAs para o lançamento.
- US8.3: Como comunidade, quero entender e participar do projeto.

**Tarefas Técnicas:**

- Produção de vídeos: abertura, bastidores e encerramento.
- Criação de thumbnails, posts e roteiros.
- Divulgação em redes da QWay e grupos parceiros.

---

## 🔹 Pendências

- Implementar `/arvore` no backend (com cache)
- Integrar `/arvore` ao frontend
- Finalizar lógica de buffer local (comentários e votos)
- Mensagens de erro e estados vazios claros
- Recarregamento automático após votar/comentar/remover
- Bloqueios visuais para ações de usuários não autenticados

---

✅ Este documento é o **registro oficial vivo** de todo o projeto QA Indica. Nenhuma definição será feita fora dele sem atualização imediata.  
Toda dúvida sobre o projeto deve ser resolvida por este **One-Pager Consolidado**.
