// Lê o arquivo indice.md do repositório e extrai nomes de Trilhas e Módulos.
// Usa OWNER/REPO/BRANCH via .env.local (Vite) com defaults para o QATS.
const OWNER = import.meta.env.VITE_REPO_OWNER ?? "qway-tech";
const REPO  = import.meta.env.VITE_REPO_NAME ?? "qats";
const BRANCH = import.meta.env.VITE_REPO_BRANCH ?? "main";

function rawUrl(path: string) {
  const clean = path.replace(/^\/+/, "");
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${clean}`;
}

export type Trilha = { id: string; nome: string };
export type Modulo = { id: string; nome: string; trilhaId: string };

type Catalogo = {
  trilhas: Trilha[];
  modulos: Modulo[]; // já mapeados por trilhaId
};

export async function fetchCatalogo(): Promise<Catalogo> {
  const res = await fetch(rawUrl("indice.md"));
  if (!res.ok) {
    console.warn("Não consegui ler indice.md do repositório:", res.status);
    return { trilhas: [], modulos: [] };
  }
  const md = await res.text();

  // Ex.: "## 📘 Trilha T01 – Fundamentos"
  const trilhaRegex = /^##\s+.*?Trilha\s+(T\d+)\s+–\s+(.+)\s*$/gmi;
  // Ex.: "### 📗 Módulo M01 – Introdução, Fundamentos e Boas Práticas"
  const moduloRegex = /^###\s+.*?M[óo]dulo\s+(M\d+)\s+–\s+(.+)\s*$/gmi;

  const trilhas: Trilha[] = [];
  const modulos: Modulo[] = [];

  // Vamos percorrer o arquivo sequencialmente, lembrando a trilha corrente
  // para associar os módulos encontrados abaixo dela.
  let currentTrilhaId: string | null = null;
  const lines = md.split(/\r?\n/);

  for (const line of lines) {
    let mTrilha = trilhaRegex.exec(line);
    if (mTrilha && mTrilha[1] && mTrilha[2]) {
      const id = mTrilha[1].toLowerCase();
      const nome = mTrilha[2].trim();
      trilhas.push({ id, nome });
      currentTrilhaId = id;
      // reset lastIndex dos regex “global” para evitar pular linhas
      trilhaRegex.lastIndex = 0;
      moduloRegex.lastIndex = 0;
      continue;
    }
    let mModulo = moduloRegex.exec(line);
    if (mModulo && currentTrilhaId && mModulo[1] && mModulo[2]) {
      const id = mModulo[1].toLowerCase();
      const nome = mModulo[2].trim();
      modulos.push({ id, nome, trilhaId: currentTrilhaId });
      trilhaRegex.lastIndex = 0;
      moduloRegex.lastIndex = 0;
      continue;
    }
    // reset a cada linha para segurança (regex global no JS mantém estado)
    trilhaRegex.lastIndex = 0;
    moduloRegex.lastIndex = 0;
  }

  return { trilhas, modulos };
}

export async function listTrilhas(): Promise<Trilha[]> {
  const { trilhas } = await fetchCatalogo();
  return trilhas;
}

export async function listModulosByTrilha(trilhaId: string): Promise<Modulo[]> {
  const { modulos } = await fetchCatalogo();
  return modulos.filter(m => m.trilhaId.toLowerCase() === trilhaId.toLowerCase());
}

export async function getTrilhaNome(trilhaId: string): Promise<string | null> {
  const t = (await listTrilhas()).find(t => t.id.toLowerCase() === trilhaId.toLowerCase());
  return t?.nome ?? null;
}
