# 📐 QA Indica — Arquitetura, Metodologia & Plano Completo

Este documento é o **Canvas Único e Vivo** do projeto **QA Indica** (também chamado no início de QA Indica). Ele centraliza todas as decisões, desde a concepção até a execução técnica, cobrindo **arquitetura, metodologia, papéis, fluxo de trabalho, plano de hackathon, backlog, segurança, performance, UX, marketing e QA**.  
Nada deve ser perdido ou resumido: todas as definições anteriores foram integradas aqui como a **única fonte da verdade (Single Source of Truth)**.

---

## 🔹 Objetivo do Projeto

Construir uma plataforma comunitária para **indicar, apoiar, comentar e moderar referências** (profissionais, empresas, cursos, comunidades, recursos educacionais) da indústria de TI.  

O projeto deve ser **aberto, auditável e transparente**, com dados armazenados em repositório público no GitHub, enquanto a aplicação roda em repositório privado.  
As interações (apoios, comentários) são registradas via backend seguro, garantindo que apenas usuários autenticados possam contribuir.

---

## 🔹 Arquitetura

### Frontend (React + Vite)

* Páginas principais: `Home`, `Referencias`, `Indicar`, `Recursos`, `Moderação`
* Estado via React Hooks (plano de evolução para Zustand/Context API)
* Comunicação com backend via REST (`fetch`)
* Persistência temporária em `localStorage` para itens pendentes
* Hospedagem: **Hostinger**
* UI Componentizada:
  - `ReferenciaCard`
  - `ReferenciaModal`
  - `ComentariosModal`
  - `Filtros`
  - Inputs genéricos: `CampoTexto`, `CampoSelect`, `ListaCheckbox`
* Botões padronizados (`btn-action`) e feedback visual (bordas verdes em preenchimento válido)

### Backend (Node + Express)

* Endpoints REST para registrar apoio, remover apoio, criar/remover comentário, criar referência
* Integração com **GitHub API**:
  - **Contents API** → criar/editar arquivos JSON (`PUT`)
  - **Trees API** → listar árvore de arquivos (`GET`) e reduzir 404
* Persistência definitiva em GitHub
* Segurança via **Personal Access Token (PAT)**, mantido no backend (`.env`)
* Hospedagem: **Hostinger API** (mesma solução usada no QWay Academy)

### Repositórios GitHub

* **Repo Público (`qway-referencias-dados`)**
  - Estrutura padronizada:
    - `referencias/positivas/*.json`
    - `referencias/negativas/*.json`
    - `referencias/positivas/comentarios/*.json`
    - `referencias/negativas/comentarios/*.json`
    - `referencias/positivas/votos/*.json`
    - `referencias/negativas/votos/*.json`
  - Leitura anônima via `raw.githubusercontent.com`
  - Escrita apenas via backend autenticado
* **Repo Privado (`qway-referencias-app`)**
  - Código do frontend e backend
  - CI/CD separado

---

## 🔹 Modelos de Dados

### Referência (exemplo positiva)

```json
{
  "id": "pos-0001",
  "natureza": "positiva",
  "tipoIndicacao": "educacao",
  "titulo": "Título do recurso",
  "nome": "Nome completo ou título",
  "empresaOuResponsavel": "Responsável",
  "tipo": "curso",
  "area": "QA",
  "especialidade": "Automação",
  "valor": "297.00",
  "descricao": "Descrição detalhada",
  "aspectosSelecionados": ["Clareza", "Didática"],
  "dataRegistro": "2025-09-17T15:45:00Z",
  "status": "pendente|aprovada|rejeitada"
}
```

### Comentários

```json
[
  { "autor": "Nome", "texto": "Comentário", "email": "user@email.com", "data": "DD/MM/YYYY, HH:mm:ss" }
]
```

### Votos

```json
[
  { "email": "user@email.com", "data": "DD/MM/YYYY, HH:mm:ss" }
]
```

---

## 🔹 Estratégia de Carregamento

* Referências determinadas pelos arquivos no GitHub (`pos-xxxx.json`, `neg-xxxx.json`)
* Comentários e votos → arquivos vinculados ao mesmo ID
* Para evitar 404:
  - Listagem única via **Git Trees API**
  - Front baixa apenas os arquivos que existem
* Front mantém cache local (`localStorage`) até sincronizar
* Consistência eventual:
  - Buffer local para referências, comentários e votos até refletirem no raw
  - Retry periódico → quando encontrado, remove buffer

---

## 🔹 UI & Design System Interno

**Problemas identificados:**
* Duplicação de código (cards positivos/negativos, campos repetidos)
* Checkboxes e labels variando
* Handlers dispersos

**Solução:**
* Componentes reutilizáveis (`Card`, `Modal`, `Filtros`, `Campos`)
* Handlers padronizados em `useReferenciasActions.ts`:

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

**Estado unificado (UIState):**

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

* Repositórios isolados (dados públicos x aplicação privada)
* Tokens GitHub apenas no backend
* CORS restrito a origens confiáveis
* Sanitização de inputs e limite de tamanho em comentários
* Controle de votos:
  - Apenas usuários logados
  - 1 voto por e-mail (idempotente)
  - Remoção de voto → exclusão da entrada
* Performance:
  - Uso de `raw.githubusercontent.com` (sem cota)
  - Cache de árvore no backend (`GET /arvore`)
  - Debounce em filtros e busca

---

## 🔹 Metodologia de Trabalho Integrada

### Papéis desempenhados

* **Solutions Architect (AI + Humano)** → define arquitetura, padrões, refactors
* **Fullstack Developer (AI + Humano)** → implementa frontend/backend
* **QA Engineer (AI + Humano)** → cria cenários de teste manuais/automatizados
* **Product Owner (Compartilhado)** → define backlog e prioridades
* **Project Manager (AI + Humano)** → organiza sprints, controla prazo, checkpoints
* **Marketing/Conteúdo** → cria vídeos, posts, materiais de divulgação

### Fluxo de trabalho

1. Discussão (no chat)
2. Atualização do Canvas (SSOT)
3. Implementação (frontend/backend)
4. Validação QA
5. Gestão de Projeto (pendências e próximos passos)

---

## 🔹 Hackathon — Execução em 3 dias

**Dia 1 — Fundamentos**
* Refinar arquitetura
* Implementar Home básica (ranking, recentes, filtros)
* Backend inicial (votos, comentários)
* Deploy de staging
* Testes manuais iniciais

**Dia 2 — Funcionalidades avançadas**
* Página de Moderação (aprovar/rejeitar pendentes)
* Refactor frontend (componentes reutilizáveis)
* Segurança mínima (login obrigatório para votar/comentar)
* Feedbacks UX (loading, erros)
* Deploy de staging atualizado
* Início dos vídeos (explicando arquitetura)

**Dia 3 — Finalização**
* Testes ponta a ponta
* Otimizações (cache, retries, debounce)
* Deploy em produção
* Gravação de vídeos finais (tour, making of)
* Marketing (LinkedIn, Instagram, YouTube)

---

## 🔹 Backlog — Épicos

1. **Gestão de Referências**
   * CRUD de referências
   * Filtros e busca
   * Modal de detalhes

2. **Interações da Comunidade**
   * Apoiar/remover apoio
   * Comentar/remover comentário
   * Contadores automáticos

3. **Moderação**
   * Painel de aprovação/rejeição
   * Status no JSON (`pendente|aprovada|rejeitada`)

4. **UI/UX**
   * Refactor em componentes
   * Filtros e busca unificados
   * Mensagens claras e acessibilidade

5. **Segurança & Performance**
   * Tokens seguros
   * Cache e debounce
   * Tratamento de erros

6. **Infra & Deploy**
   * CI/CD (dados e app separados)
   * Deploy frontend (Hostinger)
   * Deploy backend (API Hostinger)

7. **QA**
   * Testes unitários, integração e E2E
   * Critérios de aceitação → CTFL + ISO/IEC/IEEE 29119

8. **Marketing**
   * Série de vídeos/documentário
   * Conteúdos para LinkedIn, YouTube, Instagram
   * Call-to-action para colaboração

---

## 🔹 Pendências Atuais

* Implementar `/arvore` no backend (Trees API + cache)
* Front consumir `/arvore` antes de buscar arquivos
* Buffer local para comentários/votos (além das referências)
* UX: bloquear ações sem login (desabilitar botões + mensagem explicativa)
* Recarregar contadores após remover voto/comentário

---

## 🔹 Decisões Arquiteturais (Resumo)

* **Leitura**: raw.githubusercontent.com (sem cota) + descoberta via `/arvore`
* **Escrita**: Backend → GitHub Contents API
* **Consistência**: otimista + cache local até propagar
* **Autenticação**: OAuth (Google/GitHub) com dados mínimos no localStorage

---

✅ Este README consolida todas as versões anteriores do Canvas, garantindo que o projeto QA Indica tenha **um único documento vivo, completo e detalhado**, cobrindo **técnica, gestão, QA, UX, marketing e execução**.
