// apps/plataforma/frontend/src/lib/qatsRepo.ts
// Utilitários para ler estrutura pública no GitHub e resultados do usuário.

export type ResultadoResumo = {
  total_questoes: number;
  acertos: number;
  erros: number;
  percentual: number;
};

export type ResultadosJSON = {
  usuario: string;
  trilha: string;
  modulo: string;
  capitulo?: string;
  tipo: "quiz" | "exame";
  tentativa: number;
  avaliado_em?: string;
  pontuacao: ResultadoResumo;
  meta?: Record<string, unknown>;
};

// Defaults (pode configurar via .env.local)
const OWNER = import.meta.env.VITE_REPO_OWNER ?? "qway-tech";
const REPO = import.meta.env.VITE_REPO_NAME ?? "qats";
const BRANCH = import.meta.env.VITE_REPO_BRANCH ?? "main";

// Helpers
const ghApi = (path: string) =>
  `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path.replace(/^\/+/, "")}`;

const rawUrl = (path: string) =>
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path.replace(/^\/+/, "")}`;

const isDir = (i: { type: string }) => i.type === "dir";

// ----------------------------
// Descobrir trilhas / módulos / capítulos
// ----------------------------

export async function listarTrilhas(): Promise<string[]> {
  const res = await fetch(ghApi("trilhas"));
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{ name: string; type: string }>;
  return items
    .filter((i) => isDir(i) && /^t\d+$/i.test(i.name))
    .map((i) => i.name.toUpperCase())
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

export async function listarModulos(tId: string): Promise<string[]> {
  const res = await fetch(ghApi(`formacoes/${tId.toLowerCase()}`));
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{ name: string; type: string }>;
  return items
    .filter((i) => isDir(i) && /^m\d+$/i.test(i.name))
    .map((i) => i.name.toUpperCase())
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

export async function listarCapitulos(tId: string, mId: string): Promise<string[]> {
  const res = await fetch(ghApi(`formacoes/${tId.toLowerCase()}/${mId.toLowerCase()}`));
  if (!res.ok) return [];
  const items = (await res.json()) as Array<{ name: string; type: string }>;
  return items
    .filter((i) => isDir(i) && /^c\d+$/i.test(i.name))
    .map((i) => i.name.toUpperCase())
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

// ----------------------------
// Links para conteúdo no repositório (README do capítulo)
// ----------------------------

export function urlReadmeCapitulo(tId: string, mId: string, cId: string): string {
  // Preferência por README do capítulo (raiz do capítulo)
  // Ex.: https://github.com/OWNER/REPO/tree/BRANCH/formacoes/t01/m01/c01
  return `https://github.com/${OWNER}/${REPO}/tree/${BRANCH}/formacoes/${tId.toLowerCase()}/${mId.toLowerCase()}/${cId.toLowerCase()}`;
}

// ----------------------------
// Resultados do usuário
// ----------------------------

export async function lerResultadoQuiz(
  userLogin: string,
  tId: string,
  mId: string,
  cId: string
): Promise<ResultadosJSON | null> {
  const path = `usuarios/@${userLogin}/${tId.toLowerCase()}/${mId.toLowerCase()}/${cId.toLowerCase()}/quiz/resultados_01.json`;
  const res = await fetch(rawUrl(path));
  if (!res.ok) return null;
  return (await res.json()) as ResultadosJSON;
}

// ----------------------------
// Regras de desbloqueio
// ----------------------------

/**
 * Liberado se for C01 OU se capítulo anterior tiver resultado.
 */
export async function podeFazerQuiz(
  userLogin: string,
  tId: string,
  mId: string,
  cId: string
): Promise<boolean> {
  const num = Number(cId.slice(1));
  if (isNaN(num) || num <= 1) return true;
  const anterior = `C${String(num - 1).padStart(2, "0")}`;
  const resAnterior = await lerResultadoQuiz(userLogin, tId, mId, anterior);
  return !!resAnterior;
}

// ----------------------------
// Perguntas do quiz (capítulo)
// ----------------------------

export type Pergunta = {
  id: string;
  pergunta: string;
  alternativas: string[]; // ordem original (índices 0..n)
};

export async function carregarPerguntas(tId: string, mId: string, cId: string): Promise<Pergunta[]> {
  const path = `formacoes/${tId.toLowerCase()}/${mId.toLowerCase()}/${cId.toLowerCase()}/quiz/perguntas.json`;
  const res = await fetch(rawUrl(path));
  if (!res.ok) return [];
  return (await res.json()) as Pergunta[];
}

// Utilidades para sortear 5 e embaralhar apresentação mantendo índice original
export function samplePerguntas(orig: Pergunta[], n = 5): Pergunta[] {
  const c = [...orig];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmpI = c[i]!;
    const tmpJ = c[j]!;
    c[i] = tmpJ;
    c[j] = tmpI;
  }
  return c.slice(0, Math.min(n, c.length));
}

export type AlternativaRender = { label: string; originalIndex: number };

export function embaralharAlternativas(p: Pergunta): AlternativaRender[] {
  const arr = p.alternativas.map((label, originalIndex) => ({ label, originalIndex }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmpI = arr[i]!;
    const tmpJ = arr[j]!;
    arr[i] = tmpJ;
    arr[j] = tmpI;
  }
  return arr;
}