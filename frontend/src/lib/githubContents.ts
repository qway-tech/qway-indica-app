export type Referencia = {
  id: string;
  natureza: "positiva" | "negativa";
  tipoIndicacao?: string;
  titulo: string;
  nome?: string;
  empresaOuResponsavel: string;
  tipo?: string;
  link?: string;
  area: string;
  valor?: string;
  descricao: string;
  aspectosSelecionados?: string[];
  dataRegistro: string;
  status: string;
};

async function fetchComToken(url: string, options: RequestInit = {}) {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
}

/**
 * Busca todas as referências de um tipo (positivas ou negativas)
 * a partir da listagem de arquivos via GitHub API, evitando múltiplos 404s.
 */
export async function fetchReferenciasPorTipo(tipo: "positivas" | "negativas"): Promise<Referencia[]> {
  try {
    const res = await fetch(`http://localhost:4001/conteudo-arquivo?path=referencias/${tipo}`);
    if (!res.ok) throw new Error(`Erro ao acessar diretório: referencias/${tipo}`);

    const data: any[] = await res.json();

    const arquivosJson = data.filter(item => item.name.endsWith(".json") && item.download_url);

    const referencias = await Promise.all(
      arquivosJson.slice(0, 20).map(async (item) => {
        try {
          const res = await fetch(`http://localhost:4001/conteudo-arquivo?path=referencias/${tipo}/${item.name}`);
          if (!res.ok) return null;
          const json = await res.json();
          return json as Referencia;
        } catch {
          return null;
        }
      })
    );

    return referencias.filter(Boolean) as Referencia[];
  } catch (e) {
    console.warn("Erro ao buscar referências:", e);
    return [];
  }
}

export { fetchComToken };
