import { useEffect, useState } from "react";
import { ThumbsUp, MessageSquare, Link as LinkIcon, X, ChevronDown, ChevronUp, XCircle, Edit } from "lucide-react";
import { fetchReferenciasPorTipo, Referencia } from "@/lib/githubContents";
import Loading from "@/components/Loading";


// Função utilitária para listar arquivos em um diretório do backend
// OBS: O backend ainda não implementa o endpoint /listar-arquivos.
// Por enquanto, sempre retorna array vazio como fallback, para evitar erros 404.
async function listarArquivosEmDiretorio(_diretorio: string): Promise<string[]> {
  // const res = await fetch(`http://localhost:4001/listar-arquivos?path=${encodeURIComponent(diretorio)}`);
  // if (!res.ok) return [];
  // return await res.json();
  return []; // Fallback até que o backend implemente o endpoint de listagem
}

// Função utilitária para carregar o conteúdo JSON de um arquivo do repositório (via raw.githubusercontent.com)
async function carregarJsonDeArquivo(path: string): Promise<any> {
  const url = `https://raw.githubusercontent.com/qway-tech/qway-indica-dados/main/${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Arquivo não encontrado:", url);
      return {};
    }
    return await res.json();
  } catch (error) {
    console.warn("Erro ao buscar arquivo do GitHub:", error);
    return {};
  }
}

export default function ReferenciasPage() {
  type Comentario = { autor: string; texto: string; data: string; email?: string };

  const [positivas, setPositivas] = useState<Referencia[]>([]);
  const [negativas, setNegativas] = useState<Referencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Referencia | null>(null);
  const [tipoAtivo, setTipoAtivo] = useState<"positivas" | "negativas" | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [contadores, setContadores] = useState<Record<string, { votos: number; comentarios: number }>>({});
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [votosUsuario, setVotosUsuario] = useState<Set<string>>(new Set());
  const [showComentarios, setShowComentarios] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"aprovada" | "pendente" | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  useEffect(() => {
    async function inicializarPaginaReferencias() {
      setLoading(true);
      setErroCarregamento(null);
      const email = await getUsuarioLogado();
      if (email) setUserEmail(email);

      // Verifica se há referência temporária salva no localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get("id");
      if (idParam) {
        const tempRef = localStorage.getItem(`ref-pending-${idParam}`);
        if (tempRef) {
          try {
            const parsed = JSON.parse(tempRef);
            setSelected(parsed);
          } catch { }
        }
      }

      let positivas: Referencia[] = [];
      let negativas: Referencia[] = [];
      try {
        const resultado = await carregarReferencias();
        positivas = resultado.positivas;
        negativas = resultado.negativas;
      } catch (err) {
        setErroCarregamento("Erro ao carregar referências. Tente novamente mais tarde.");
        setLoading(false);
        return;
      }

      // Carregar referências pendentes do localStorage
      const pendentesLocal = Object.keys(localStorage)
        .filter((key) => key.startsWith("ref-pending-"))
        .map((key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || "");
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Referencia[];

      const todas = [...positivas, ...negativas];
      const todasComPendentes = [...todas, ...pendentesLocal];

      // Ajustar chamadas para usar todasComPendentes
      const contadores = await carregarContadores(todasComPendentes);
      setContadores(contadores);

      const votos: Set<string> = email ? await carregarVotosUsuario(todasComPendentes, email) : new Set<string>();
      setVotosUsuario(votos);

      // Busca referência oficial por id da URL e remove temporária do localStorage
      const urlParams2 = new URLSearchParams(window.location.search);
      const idParam2 = urlParams2.get("id");
      let refSelecionada: Referencia | undefined = undefined;
      if (idParam2) {
        refSelecionada = todasComPendentes.find((r) => r.id === idParam2);
        if (refSelecionada) {
          setSelected(refSelecionada);
          // Se a referência ainda não está em positivas/negativas, adiciona manualmente
          if (!todasComPendentes.find(r => r.id === refSelecionada!.id)) {
            if (refSelecionada.natureza === "positiva") {
              setPositivas((prev) => [...prev, refSelecionada!]);
            } else {
              setNegativas((prev) => [...prev, refSelecionada!]);
            }
          }
          const newUrl = `${window.location.origin}${window.location.pathname}?id=${refSelecionada.id}`;
          window.history.pushState({ id: refSelecionada.id }, "", newUrl);
        }
        // Limpeza do localStorage ao detectar referência vinda do GitHub
        localStorage.removeItem(`ref-pending-${idParam2}`);
      }


      // Remove do localStorage referências que já vieram do GitHub
      todasComPendentes.forEach((ref) => {
        if (ref?.id) {
          localStorage.removeItem(`ref-pending-${ref.id}`);
        }
      });

      // Ajustar setPositivas e setNegativas para incluir pendentes
      setPositivas([...positivas, ...pendentesLocal.filter(r => r.natureza === "positiva")]);
      setNegativas([...negativas, ...pendentesLocal.filter(r => r.natureza === "negativa")]);

      setLoading(false);
    }

    inicializarPaginaReferencias();
  }, [userEmail]);

  if (loading) return <Loading texto="Carregando referências..." />;

  if (erroCarregamento) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-red-700 mb-4">Erro ao carregar</h1>
        <p className="text-gray-600">{erroCarregamento}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mt-4 text-center sm:text-left sm:items-center">
        <h1 className="text-3xl font-bold text-center sm:text-left">Referências da Comunidade</h1>
        <div className="mt-0 sm:mt-[-30px] sm:self-end flex justify-center sm:justify-end">
          <div className="bg-grey-1 border border-grey-2 px-4 py-2 rounded flex flex-col max-w-sm text-sm text-grey-4 text-center mx-auto">
            <span className="mb-1">
              Tem algo ou alguém que marcou positivamente ou negativamente sua jornada na área de tecnologia e que merece destaque ou atenção?
            </span>
            <a
              href="/indicar"
              className="btn-action text-sm font-bold transition border bg-yellow text-grey-4 border-yellow hover:brightness-110 self-center flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Indicar uma referência
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white rounded p-4 border mt-0 mb-6 relative">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold mb-2">Filtros e Pesquisa</h2>
            {!filtrosVisiveis && (
              <div className="flex flex-wrap gap-2 text-sm text-grey-4">
                <span
                  onClick={(e) => {
                    // Se clicar no botão interno de fechar (X), não abrir
                    if ((e.target as HTMLElement).closest("button")) return;
                    setFiltrosVisiveis(true);
                  }}
                  className="inline-flex items-center bg-grey-1 px-3 py-1 rounded font-medium cursor-pointer hover:brightness-95"
                >
                  {/* Localização: Natureza dos filtros */}
                  Natureza:{" "}
                  {tipoAtivo === "positivas"
                    ? "Positivas"
                    : tipoAtivo === "negativas"
                      ? "Negativas"
                      : "Todas"}
                  {(tipoAtivo === "positivas" || tipoAtivo === "negativas") && (
                    <button
                      className="ml-2 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTipoAtivo(null);
                      }}
                      aria-label="Remover filtro"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </span>
                <span
                  onClick={(e) => {
                    // Se clicar no botão interno de fechar (X), não abrir
                    if ((e.target as HTMLElement).closest("button")) return;
                    setFiltrosVisiveis(true);
                  }}
                  className="inline-flex items-center bg-grey-1 px-3 py-1 rounded font-medium cursor-pointer hover:brightness-95"
                >
                  {/* Localização: Tipo dos filtros */}
                  Tipo:{" "}
                  {[
                    { value: "profissional", label: "Profissionais" },
                    { value: "empresa", label: "Empresas" },
                    { value: "educacao", label: "Recursos de Educação" },
                    { value: "conteudo", label: "Fontes de Conteúdo" },
                    { value: "comunidade", label: "Comunidades" },
                  ].find((f) => f.value === filtroTipo)?.label || "Todos"}
                  {filtroTipo !== null && (
                    <button
                      className="ml-2 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiltroTipo(null);
                      }}
                      aria-label="Remover filtro"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </span>
              </div>
            )}
          </div>
          <button
            className={`btn-action px-2 py-1 text-grey-4 ${filtrosVisiveis ? "bg-grey-2" : "bg-grey-1"}`}
            onClick={() => setFiltrosVisiveis((v) => !v)}
          >
            {filtrosVisiveis ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        {filtrosVisiveis && (
          <>
            <hr className="my-3 border-t border-grey-2" />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Natureza da Referência:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "positivas", label: "Positivas" },
                    { value: "negativas", label: "Negativas" },
                    { value: null, label: "Todas" },
                  ].map(({ value, label }) => (
                    <button
                      key={label}
                      onClick={() => setTipoAtivo(value as any)}
                      className={`btn-action text-sm font-bold transition border ${tipoAtivo === value
                        ? "bg-grey-3 text-yellow border-grey-3"
                        : "bg-grey-1 text-grey-4 border-grey-4"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <hr className="my-3 border-t border-grey-2" />
            <p className="text-sm font-semibold mb-2 mt-4">Tipo de Referência:</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "profissional", label: "Profissionais" },
                { value: "empresa", label: "Empresas" },
                { value: "educacao", label: "Recursos de Educação" },
                { value: "conteudo", label: "Fontes de Conteúdo" },
                { value: "comunidade", label: "Comunidades" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFiltroTipo(filtroTipo === value ? null : value)}
                  className={`btn-action text-sm font-bold transition border ${filtroTipo === value
                    ? "bg-grey-3 text-yellow border-grey-3"
                    : "bg-grey-1 text-grey-4 border-grey-4"
                    }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setFiltroTipo(null)}
                className={`btn-action text-sm font-bold transition border ${filtroTipo === null
                  ? "bg-grey-3 text-yellow border-grey-3"
                  : "bg-grey-1 text-grey-4 border-grey-4"
                  }`}
              >
                Todos
              </button>
            </div>
            <hr className="my-3 border-t border-grey-2" />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-0 mt-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Status da Referência:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "aprovada", label: "Aprovadas" },
                    { value: "pendente", label: "Pendentes" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFiltroStatus(filtroStatus === value ? null : (value as "aprovada" | "pendente" | null))}
                      className={`btn-action text-sm font-bold transition border ${filtroStatus === value
                        ? "bg-grey-3 text-yellow border-grey-3"
                        : "bg-grey-1 text-grey-4 border-grey-4"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => setFiltroStatus(null)}
                    className={`btn-action text-sm font-bold transition border ${filtroStatus === null
                      ? "bg-grey-3 text-yellow border-grey-3"
                      : "bg-grey-1 text-grey-4 border-grey-4"
                      }`}
                  >
                    Todas
                  </button>
                </div>
              </div>
              <div className="flex flex-col w-full sm:w-80 sm:ml-auto">
                <label className="text-sm font-semibold block mb-1">Buscar por palavra-chave:</label>
                <input
                  type="text"
                  placeholder="🔍 Pesquisar por título, nome ou responsável..."
                  className="w-full px-4 py-2 border border-grey-2 rounded bg-white text-sm text-grey-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

              </div>
            </div>
            <hr className="my-3 border-t border-grey-2" />
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => setFiltrosVisiveis(false)}
                className="btn-action text-sm font-bold transition border bg-yellow text-grey-4 border-yellow hover:brightness-110"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={() => {
                  setTipoAtivo(null);
                  setFiltroTipo(null);
                  setFiltroStatus(null);
                  setSearchTerm("");
                  setFiltrosVisiveis(false);
                }}
                className="btn-action text-sm font-bold transition border bg-yellow text-grey-4 border-yellow hover:brightness-110"
              >
                Limpar Filtros
              </button>
            </div>
          </>
        )}
      </div>


      <section className="mt-8">
        {(tipoAtivo === "positivas" || tipoAtivo === null) && positivas.filter(ref =>
          (!filtroStatus || ref.status === filtroStatus) &&
          (!filtroTipo || ref.tipoIndicacao?.toLowerCase() === filtroTipo.toLowerCase()) &&
          (!searchTerm ||
            ref.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.empresaOuResponsavel?.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length > 0 && (
            <>
              <h2 className="text-xl font-bold text-green-700 mb-4">Referências Positivas</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {positivas
                  .filter(ref =>
                    (!filtroStatus || ref.status === filtroStatus) &&
                    (!filtroTipo || ref.tipoIndicacao?.toLowerCase() === filtroTipo.toLowerCase()) &&
                    (!searchTerm ||
                      ref.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      ref.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      ref.empresaOuResponsavel?.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((ref) => (
                    <div
                      key={ref.id}
                      className="card-trilha flex flex-col justify-between h-full border-green-500 border p-4"
                    >
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          “{ref.titulo}”
                        </h3>
                        {ref.nome && (
                          <h4 className="text-md font-semibold text-grey-4 mt-1">
                            {ref.tipoIndicacao === "profissional"
                              ? "Profissional: "
                              : ref.tipoIndicacao === "empresa"
                                ? "Empresa: "
                                : ref.tipo
                                  ? `${ref.tipo.charAt(0).toUpperCase()}${ref.tipo.slice(1)}: `
                                  : ""}
                            {ref.nome}
                          </h4>
                        )}
                        <p className="mt-2 text-body text-sm">{ref.descricao.slice(0, 100)}...</p>
                        {/* Status: Pendente duplicado removido */}
                      </div>
                      {ref.status === "aprovada" && (
                        <>
                          <div className="flex justify-between items-center mt-4 text-xs text-gray-600">
                            <span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                                <span>{contadores[ref.id]?.comentarios ?? 0} comentários</span>
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              {userEmail && votosUsuario.has(ref.id) ? (
                                <ThumbsUp fill="currentColor" className="w-5 h-5 text-green-700" />
                              ) : (
                                <ThumbsUp className="w-5 h-5 stroke-[2.5]" />
                              )}
                              <span>{contadores[ref.id]?.votos ?? 0} apoios</span>
                            </span>
                          </div>
                          <button
                            className="btn-action mt-3"
                            onClick={() => {
                              setSelected(ref);
                              setShowComentarios(false);
                              const newUrl = `${window.location.origin}${window.location.pathname}?id=${ref.id}`;
                              window.history.pushState({ id: ref.id }, "", newUrl);
                            }}
                          >
                            Detalhes
                          </button>
                        </>
                      )}
                      {ref.status === "pendente" && (
                        <>
                          <p className="text-xs font-semibold text-red-600 mt-2 text-right">Status: Pendente</p>
                          <button
                            className="btn-action mt-3"
                            onClick={() => {
                              setSelected(ref);
                              setShowComentarios(false);
                              const newUrl = `${window.location.origin}${window.location.pathname}?id=${ref.id}`;
                              window.history.pushState({ id: ref.id }, "", newUrl);
                            }}
                          >
                            Detalhes
                          </button>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        {(tipoAtivo === "negativas" || tipoAtivo === null) && negativas.filter(ref =>
          (!filtroStatus || ref.status === filtroStatus) &&
          (!filtroTipo || ref.tipoIndicacao?.toLowerCase() === filtroTipo.toLowerCase()) &&
          (!searchTerm ||
            ref.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.empresaOuResponsavel?.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length > 0 && (
            <>
              <h2 className="text-xl font-bold text-red-700 mb-4 mt-12">Referências Negativas</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {negativas
                  .filter(ref =>
                    (!filtroStatus || ref.status === filtroStatus) &&
                    (!filtroTipo || ref.tipoIndicacao?.toLowerCase() === filtroTipo.toLowerCase()) &&
                    (!searchTerm ||
                      ref.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      ref.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      ref.empresaOuResponsavel?.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((ref) => (
                    <div
                      key={ref.id}
                      className="card-trilha flex flex-col justify-between h-full border-red-500 border p-4"
                    >
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          “{ref.titulo}”
                        </h3>
                        {ref.nome && (
                          <h4 className="text-md font-semibold text-grey-4 mt-1">
                            {ref.tipoIndicacao === "profissional"
                              ? "Profissional: "
                              : ref.tipoIndicacao === "empresa"
                                ? "Empresa: "
                                : ref.tipo
                                  ? `${ref.tipo.charAt(0).toUpperCase()}${ref.tipo.slice(1)}: `
                                  : ""}
                            {ref.nome}
                          </h4>
                        )}
                        <p className="mt-2 text-body text-sm">{ref.descricao.slice(0, 100)}...</p>
                        {/* Status: Pendente duplicado removido */}
                      </div>
                      {ref.status === "aprovada" && (
                        <>
                          <div className="flex justify-between items-center mt-4 text-xs text-gray-600">
                            <span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                                <span>{contadores[ref.id]?.comentarios ?? 0} comentários</span>
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              {userEmail && votosUsuario.has(ref.id) ? (
                                <ThumbsUp fill="currentColor" className="w-5 h-5 text-green-700" />
                              ) : (
                                <ThumbsUp className="w-5 h-5 stroke-[2.5]" />
                              )}
                              <span>{contadores[ref.id]?.votos ?? 0} apoios</span>
                            </span>
                          </div>
                          <button
                            className="btn-action mt-3"
                            onClick={() => {
                              setSelected(ref);
                              setShowComentarios(false);
                              const newUrl = `${window.location.origin}${window.location.pathname}?id=${ref.id}`;
                              window.history.pushState({ id: ref.id }, "", newUrl);
                            }}
                          >
                            Detalhes
                          </button>
                        </>
                      )}
                      {ref.status === "pendente" && (
                        <>
                          <p className="text-xs font-semibold text-red-600 mt-2 text-right">Status: Pendente</p>
                          <button
                            className="btn-action mt-3"
                            onClick={() => {
                              setSelected(ref);
                              setShowComentarios(false);
                              const newUrl = `${window.location.origin}${window.location.pathname}?id=${ref.id}`;
                              window.history.pushState({ id: ref.id }, "", newUrl);
                            }}
                          >
                            Detalhes
                          </button>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        {(positivas.filter(ref =>
          (!filtroStatus || ref.status === filtroStatus) &&
          (!filtroTipo || ref.tipoIndicacao?.toLowerCase() === filtroTipo.toLowerCase()) &&
          (!searchTerm ||
            ref.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.empresaOuResponsavel?.toLowerCase().includes(searchTerm.toLowerCase()))
        ).length === 0 &&
          negativas.filter(ref =>
            (!filtroStatus || ref.status === filtroStatus) &&
            (!filtroTipo || ref.tipoIndicacao?.toLowerCase() === filtroTipo.toLowerCase()) &&
            (!searchTerm ||
              ref.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              ref.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              ref.empresaOuResponsavel?.toLowerCase().includes(searchTerm.toLowerCase()))
          ).length === 0) && (
            <p className="text-center text-sm text-gray-500 mt-12">
              Nenhuma referência encontrada com os filtros selecionados.
            </p>
          )}
      </section>

      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white p-6 rounded max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-xl bg-grey-2 text-black rounded hover:brightness-110 transition"
              onClick={() => {
                setSelected(null);
                window.history.pushState({}, "", window.location.pathname);
              }}
              aria-label="Fechar detalhes"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Título e nome SEMPRE visíveis acima do conteúdo do modal */}
            <h2 className="text-2xl font-bold mb-2">“{selected.titulo}”</h2>
            <h3 className="text-lg font-semibold text-grey-4 mb-1">
              {selected.tipo === "profissional"
                ? "Profissional: "
                : selected.tipo
                  ? `${selected.tipo.charAt(0).toUpperCase()}${selected.tipo.slice(1)}: `
                  : ""}
              {selected.nome}
            </h3>
            {/* Comentários embutidos no modal de detalhes */}
            {showComentarios && (
              <div className="bg-gray-100 mt-4 p-4 rounded border border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold">Comentários</h4>
                  <button
                    onClick={() => setShowComentarios(false)}
                    className="w-8 h-8 flex items-center justify-center text-xl bg-grey-2 text-black rounded hover:brightness-110 transition"
                    aria-label="Fechar comentários"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {comentarios.length === 0 ? (
                  <p className="text-sm text-muted mb-4">Nenhum comentário ainda.</p>
                ) : (
                  <ul className="space-y-4 mb-4">
                    {comentarios.map((c, i) => (
                      <li key={i} className="border-b pb-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold">{c.autor}</p>
                          {userEmail && c.email === userEmail && (
                            <button
                              className="text-xs text-red-600 hover:underline"
                              onClick={async () => {
                                const confirmar = window.confirm("Tem certeza que deseja remover este comentário?");
                                if (!confirmar) return;

                                const comentarioRemovido = comentarios[i];
                                try {
                                  const response = await fetch("http://localhost:4001/remover-comentario", {
                                    method: "DELETE",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      referenciaId: selected?.id,
                                      natureza: selected?.natureza,
                                      comentarioIndex: i,
                                      email: userEmail,
                                    }),
                                  });

                                  if (!response.ok) throw new Error("Erro ao remover comentário");

                                  setComentarios((prev) => prev.filter((_, idx) => idx !== i));
                                  alert("Comentário removido com sucesso.");
                                } catch (err) {
                                  alert("Erro ao remover o comentário. Tente novamente.");
                                }
                              }}
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{c.data}</p>
                        <p className="text-sm mt-1">{c.texto}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const autor = (form.elements.namedItem("autor") as HTMLInputElement).value.trim();
                    const texto = (form.elements.namedItem("texto") as HTMLInputElement).value.trim();
                    if (!autor || !texto || !selected?.id || !selected?.natureza) return;

                    const agora = new Date();
                    const dataHoje = agora.toISOString().split("T")[0];
                    const horaAgora = new Date().toLocaleTimeString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });

                    const novoComentario = {
                      autor,
                      texto,
                      data: dataHoje + ' ' + horaAgora,
                      ...(userEmail ? { email: userEmail } : {})
                    };

                    // Atualiza visualmente
                    setComentarios((prev) => [...prev, novoComentario]);

                    // Limpa o formulário
                    form.reset();

                    // Log para diagnosticar o corpo enviado ao backend
                    console.log("Enviando comentário para o backend:", {
                      referenciaId: selected.id,
                      natureza: selected.natureza,
                      comentario: novoComentario,
                    });
                    // Envia para o backend
                    try {
                      const response = await fetch("http://localhost:4001/registrar-comentario", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          referenciaId: selected.id,
                          natureza: selected.natureza,
                          comentario: novoComentario,
                        }),
                      });

                      if (!response.ok) throw new Error("Erro ao registrar comentário");
                    } catch (err) {
                      alert("Erro ao registrar o comentário. Tente novamente.");
                    }
                  }}
                  className="mt-4 space-y-2"
                >
                  <input
                    name="autor"
                    placeholder="Seu nome"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                    required
                  />
                  <textarea
                    name="texto"
                    placeholder="Seu comentário"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                    rows={3}
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded font-medium"
                  >
                    Enviar comentário
                  </button>
                </form>
              </div>
            )}
            {!showComentarios && (
              <>
                <div className="text-body whitespace-pre-line mb-4">{selected.descricao}</div>
                {Array.isArray(selected.aspectosSelecionados) && selected.aspectosSelecionados.length > 0 && (
                  <>
                    <h4 className="font-semibold">Aspectos destacados:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                      {selected.aspectosSelecionados.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                    {selected.status === "aprovada" && (
                      <div className="flex justify-between items-center text-sm font-medium text-gray-800 mt-6 mb-4 border-t pt-4 border-gray-200">
                        <span className="flex items-center gap-1 text-lg font-semibold text-gray-800">
                          <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                          <span>{contadores[selected.id]?.comentarios ?? 0} comentários</span>
                        </span>
                        <span className="flex items-center gap-1">
                          {userEmail && votosUsuario.has(selected.id) ? (
                            <ThumbsUp fill="currentColor" className="w-5 h-5 text-green-700" />
                          ) : (
                            <ThumbsUp className="w-5 h-5 stroke-[2.5]" />
                          )}
                          <span className="flex items-center gap-1 text-lg font-semibold text-gray-800">{contadores[selected.id]?.votos ?? 0} apoios</span>
                        </span>
                      </div>
                    )}
                  </>
                )}
                {(!Array.isArray(selected.aspectosSelecionados) || selected.aspectosSelecionados.length === 0) && (
                  selected.status === "aprovada" && (
                    <div className="flex justify-between items-center text-sm font-medium text-gray-800 mt-6 mb-4 border-t pt-4 border-gray-200">
                      <span className="flex items-center gap-1">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                          <span>{contadores[selected.id]?.comentarios ?? 0} comentários</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        {userEmail && votosUsuario.has(selected.id) ? (
                          <ThumbsUp fill="currentColor" className="w-5 h-5 text-green-700" />
                        ) : (
                          <ThumbsUp className="w-5 h-5 stroke-[2.5]" />
                        )}
                        <span>{contadores[selected.id]?.votos ?? 0} apoios</span>
                      </span>
                    </div>
                  )
                )}
                {selected.status === "aprovada" && (
                  <div className="mt-6 flex justify-between items-center gap-4">
                    {(contadores[selected.id]?.comentarios ?? 0) > 0 ? (
                      <button
                        onClick={async () => {
                          setShowComentarios(true);
                          try {
                            const tipo = selected.natureza === "positiva" ? "positivas" : "negativas";
                            const url = `https://raw.githubusercontent.com/qway-tech/qway-indica-dados/main/referencias/${tipo}/comentarios/${selected.id.toLowerCase()}.json`;
                            const res = await fetch(url);
                            if (res.ok) {
                              const json = await res.json();
                              setComentarios(Array.isArray(json) ? json : (Array.isArray(json.comentarios) ? json.comentarios : []));
                            } else {
                              setComentarios([]);
                            }
                          } catch {
                            setComentarios([]);
                          }
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded font-medium"
                      >
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                          <span>Ver comentários</span>
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setShowComentarios(true);
                          try {
                            const tipo = selected.natureza === "positiva" ? "positivas" : "negativas";
                            const url = `https://raw.githubusercontent.com/qway-tech/qway-indica-dados/main/referencias/${tipo}/comentarios/${selected.id.toLowerCase()}.json`;
                            const res = await fetch(url);
                            if (res.ok) {
                              const json = await res.json();
                              setComentarios(Array.isArray(json) ? json : (Array.isArray(json.comentarios) ? json.comentarios : []));
                            } else {
                              setComentarios([]);
                            }
                          } catch {
                            setComentarios([]);
                          }
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded font-medium"
                      >
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                          <span>Comentar</span>
                        </span>
                      </button>
                    )}
                    <button
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded font-medium"
                      onClick={() => {
                        const url = `${window.location.origin}/referencias?id=${selected.id}`;
                        navigator.clipboard.writeText(url);
                        alert("Link copiado para a área de transferência!");
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-5 h-5 stroke-[2.5]" />
                        <span>Copiar link da referência</span>
                      </span>
                    </button>
                    {!userEmail ? (
                      <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-sm rounded font-medium text-grey-3 cursor-not-allowed"
                      >
                        <ThumbsUp className="w-5 h-5 text-black" />
                        Apoiar esta referência
                      </button>
                    ) : votosUsuario.has(selected.id) ? (
                      <button
                        onClick={async () => {
                          if (!userEmail) return;
                          try {
                            const response = await fetch("http://localhost:4001/remover-voto", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                referenciaId: selected.id,
                                email: userEmail,
                              }),
                            });

                            if (!response.ok) throw new Error("Erro ao remover apoio");

                            setContadores(prev => ({
                              ...prev,
                              [selected.id]: {
                                votos: Math.max((prev[selected.id]?.votos ?? 1) - 1, 0),
                                comentarios: prev[selected.id]?.comentarios ?? 0,
                              },
                            }));
                            setVotosUsuario(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(selected.id);
                              return newSet;
                            });
                          } catch (err) {
                            alert("Erro ao remover apoio. Tente novamente.");
                          }
                        }}
                        className="group flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-sm rounded font-medium text-grey-4 hover:text-red-600 transition"
                      >
                        <ThumbsUp className="w-5 h-5 text-black group-hover:text-red-600" />
                        Remover apoio
                      </button>
                    ) : (
                      // Botão "Apoiar esta referência" localizado e com chamada ao backend (refatorado)
                      <button
                        onClick={async () => {
                          if (!userEmail) return;

                          try {
                            const response = await fetch("http://localhost:4001/registrar-voto", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                referenciaId: selected.id,
                                natureza: selected.natureza,
                                voto: { email: userEmail },
                              }),
                            });

                            if (response.status === 409) {
                              // Apoio já existe, apenas atualiza o estado
                              setVotosUsuario(prev => new Set(prev).add(selected.id));
                              return;
                            }

                            if (!response.ok) throw new Error("Erro ao registrar apoio");

                            // Atualiza contador de votos
                            setContadores(prev => ({
                              ...prev,
                              [selected.id]: {
                                votos: (prev[selected.id]?.votos ?? 0) + 1,
                                comentarios: prev[selected.id]?.comentarios ?? 0,
                              },
                            }));

                            setVotosUsuario(prev => {
                              const newSet = new Set(prev);
                              newSet.add(selected.id);
                              return newSet;
                            });
                          } catch (err) {
                            alert("Erro ao registrar apoio. Tente novamente.");
                          }
                        }}
                        className="group flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded font-medium text-grey-4 hover:text-green-700 transition"
                      >
                        <ThumbsUp className="w-5 h-5 text-black group-hover:text-green-700 group-hover:fill-current" />
                        Apoiar esta referência
                      </button>
                    )}
                  </div>
                )}
                {selected.status === "pendente" && (
                  <div className="text-right mt-6">
                    <p className="text-sm text-red-600 font-semibold">Status: Pendente</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
// Função para obter o usuário logado
async function getUsuarioLogado(): Promise<string | null> {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      return parsed?.email || null;
    } catch {
      return null;
    }
  }
  return null;
}

// Função para carregar referências positivas e negativas
async function carregarReferencias() {
  const [positivas, negativas] = await Promise.all([
    fetchReferenciasPorTipo("positivas"),
    fetchReferenciasPorTipo("negativas"),
  ]);
  return { positivas, negativas };
}


// Função para carregar contadores de comentários e votos de cada referência.
async function carregarContadores(referencias: Referencia[]) {
  try {
    // Não dependemos mais de listarArquivosEmDiretorio, pois o backend não retorna os arquivos.
    // Assumimos que o arquivo sempre tem o nome `${ref.id}.json` para cada referência aprovada.
    const allVotos = referencias.filter(r => r.status === "aprovada").map(r => r.id + ".json");
    const allComentarios = referencias.filter(r => r.status === "aprovada").map(r => r.id + ".json");

    const contadores: Record<string, { comentarios: number; votos: number }> = {};
    for (const ref of referencias) {
      let votos = 0;
      let comentarios = 0;
      if (ref.status === "aprovada") {
        const idArquivo = `${ref.id}.json`;
        const tipo = ref.natureza === "positiva" ? "positivas" : "negativas";
        // Tenta carregar sempre o arquivo de votos
        try {
          const caminho = `referencias/${tipo}/votos/${ref.id}.json`;
          const json = await carregarJsonDeArquivo(caminho);
          votos = Array.isArray(json)
            ? json.length
            : Array.isArray(json.votos)
              ? json.votos.length
              : 0;
        } catch (err) {
          // Falha ao carregar votos: assume 0
        }
        // Tenta carregar sempre o arquivo de comentários
        try {
          const caminho = `referencias/${tipo}/comentarios/${ref.id}.json`;
          const json = await carregarJsonDeArquivo(caminho);
          comentarios = Array.isArray(json) ? json.length
            : Array.isArray(json.comentarios) ? json.comentarios.length
              : 0;
        } catch (err) {
          // Falha ao carregar comentários: assume 0
        }
      }
      contadores[ref.id] = { votos, comentarios };
    }
    return contadores;
  } catch (err) {
    console.warn("Erro ao carregar contadores de votos/comentários:", err);
    // fallback: retorna zerados
    const entries = referencias.map((ref) => [ref.id, { comentarios: 0, votos: 0 }]);
    return Object.fromEntries(entries);
  }
}

// Função para carregar votos feitos pelo usuário logado.
async function carregarVotosUsuario(referencias: Referencia[], email: string): Promise<Set<string>> {
  try {
    const votosFeitos = new Set<string>();
    for (const ref of referencias) {
      if (ref.status !== "aprovada") continue;
      const tipo = ref.natureza === "positiva" ? "positivas" : "negativas";
      const idArquivo = `${ref.id}.json`;
      // Não depende mais de allVotos, tenta carregar sempre o arquivo de votos
      try {
        const caminho = `referencias/${tipo}/votos/${ref.id}.json`;
        const json = await carregarJsonDeArquivo(caminho);
        const votos = Array.isArray(json)
          ? json
          : Array.isArray(json.votos)
            ? json.votos
            : [];
        if (votos.some((v: any) => v.email === email)) {
          votosFeitos.add(ref.id);
        }
      } catch (err) {
        // Falha ao carregar votos do usuário para ref.id: ignora
      }
    }
    return votosFeitos;
  } catch (err) {
    console.warn("Erro ao carregar votos do usuário:", err);
    return new Set<string>();
  }
}
