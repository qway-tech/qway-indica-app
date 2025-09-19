import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AREAS = [
  "QA",
  "Desenvolvimento Front-end",
  "Desenvolvimento Back-end",
  "Full Stack",
  "Dados/Engenharia de Dados",
  "Ciência de Dados/IA",
  "DevOps/SRE",
  "Segurança da Informação",
  "UX/UI",
  "Produto/Gestão de Produto",
  "Infra/Cloud",
  "Suporte/Service Desk",
  "Agile/PMO",
  "Outro",
];

const AREAS_EMPRESA = [
  "Consultoria",
  "Educação",
  "Desenvolvimento de Software",
  "Recursos Humanos e Recrutamento",
  "Plataformas/Produtos Digitais",
  "Eventos e Comunidades",
  "Outro",
];

const TIPOS_INDICACAO = [
  "Profissional",
  "Empresa",
  "Educação",
  "Conteúdo",
  "Comunidade",
];

export default function IndicarPage() {
  // Estilo claro (força fundo branco e fonte escura em todos os campos, inclusive autofill)
  const field =
    "w-full rounded-md border px-3 py-2 bg-white text-black placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 selection:bg-blue-200 selection:text-black autofill:shadow-[inset_0_0_0px_1000px_white] autofill:text-black [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-black [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:caret-black";
  const navigate = useNavigate();
  const [form, setForm] = useState<{
    natureza: string;
    titulo: string;
    nome: string;
    empresaOuResponsavel: string;
    area: string;
    areaOutra: string;
    tipo: string;
    tipoOutro: string;
    valor: string;
    descricao: string;
    aspectosNegativos: string[];
    tipoIndicacao: string;
    especialidade: string;
    link: string; // <-- novo campo
  }>({
    natureza: "positiva",
    titulo: "",
    nome: "",
    empresaOuResponsavel: "",
    area: "",
    areaOutra: "",
    tipo: "",
    tipoOutro: "",
    valor: "",
    descricao: "",
    aspectosNegativos: [],
    tipoIndicacao: "",
    especialidade: "",
    link: "", // <-- novo campo
  });
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTentouEnviar(true);

    // Validação de campos obrigatórios
    const camposObrigatorios = ["titulo", "nome", "empresaOuResponsavel", "descricao"];
    const faltando = camposObrigatorios.filter((campo) => !form[campo as keyof typeof form]);
    if (faltando.length > 0) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      ...form,
      area:
        form.area === "Outro"
          ? form.areaOutra?.trim() || "Outro"
          : form.area,
      tipo:
        form.tipo === "outro"
          ? form.tipoOutro?.trim() || "outro"
          : form.tipo,
    };

    const folder = form.natureza === "positiva" ? "positivas" : "negativas";
    const prefix = form.natureza === "positiva" ? "pos" : "neg";

    // Buscar o maior número atual disponível
    let nextId = 1;
    const githubPath = `https://api.github.com/repos/qway-tech/qway-referencias/contents/referencias/${folder}`;
    try {
      const response = await fetch(githubPath);
      const files = await response.json();
      const ids = files
        .map((f: any) => parseInt(f.name.replace(`${prefix}-`, "").replace(".json", "")))
        .filter((n: number) => !isNaN(n));
      nextId = Math.max(...ids, 0) + 1;
    } catch (err) {
      console.warn("Não foi possível acessar os arquivos via GitHub API:", err);
    }

    const paddedId = String(nextId).padStart(4, "0");
    const filename = `${prefix}-${paddedId}.json`;
    const fullPayload = {
      ...payload,
      id: filename.replace(".json", ""),
      data: new Date().toISOString(),
      status: "pendente",
      link: form.link, // <-- incluído no payload
    };

    // Salvar referência via API
    try {
      const response = await fetch("/api/registrar-referencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          natureza: form.natureza,
          conteudo: {
            ...payload,
            id: filename.replace(".json", ""),
            data: new Date().toISOString(),
            status: "pendente",
            link: form.link, // <-- incluído também aqui
          },
          filename,
          folder,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao registrar referência");
      }

      // Armazena referência localmente até ser encontrada via GET
      const referenciaTempKey = `ref-pending-${filename.replace(".json", "")}`;
      localStorage.setItem(referenciaTempKey, JSON.stringify(fullPayload));

      alert("Referência registrada com sucesso!");
      navigate(`/referencias?id=${filename.replace(".json", "")}`);
    } catch (err) {
      console.error("Erro ao salvar no GitHub:", err);
      alert("Falha ao registrar a referência.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto mt-12">
      <button className="btn-back mb-6" onClick={() => navigate(-1)}>
        ← Voltar
      </button>
      <h1 className="text-3xl font-bold mb-6">📢 Registrar Referência</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Natureza da referência:</label>
        <div className="flex gap-6">
          <label>
            <input
              type="radio"
              name="natureza"
              value="positiva"
              checked={form.natureza === "positiva"}
              onChange={handleChange}
              className="mr-2"
            />
            Positiva
          </label>
          <label>
            <input
              type="radio"
              name="natureza"
              value="negativa"
              checked={form.natureza === "negativa"}
              onChange={handleChange}
              className="mr-2"
            />
            Negativa
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Tipo de indicação <span className="text-red-500">*</span>
        </label>
        <select
          name="tipoIndicacao"
          value={form.tipoIndicacao}
          onChange={handleChange}
          className={`${field} h-[42px] ${tentouEnviar && !form.tipoIndicacao ? 'border-red-500' : form.tipoIndicacao ? 'border-green-500' : ''}`}
          required
        >
          <option value="">Selecione...</option>
          {TIPOS_INDICACAO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        {tentouEnviar && !form.tipoIndicacao && (
          <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Título/frase descritiva para cada tipo */}
        {form.tipoIndicacao && (
          <div>
            <label htmlFor="titulo" className="block mb-1 font-medium">
              {form.tipoIndicacao === "Profissional"
                ? <>Como você descreveria esse profissional em uma frase? <span className="text-red-500">*</span></>
                : form.tipoIndicacao === "Empresa"
                ? <>Como você descreveria essa empresa em uma frase? <span className="text-red-500">*</span></>
                : form.tipoIndicacao === "Conteúdo"
                ? <>Como você descreveria essa fonte de conteúdo em uma frase? <span className="text-red-500">*</span></>
                : form.tipoIndicacao === "Comunidade"
                ? <>Como você descreveria essa comunidade em uma frase? <span className="text-red-500">*</span></>
                : form.tipoIndicacao === "Educação"
                ? <>Como você descreveria esse curso/mentoria/etc em uma frase? <span className="text-red-500">*</span></>
                : <>Título <span className="text-red-500">*</span></>}
            </label>
            <input
              id="titulo"
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder={
                form.tipoIndicacao === "Profissional"
                  ? "Ex.: Profissional ético, colaborativo e com ótima didática"
                  : form.tipoIndicacao === "Empresa"
                  ? "Ex.: Empresa com forte cultura de aprendizado e respeito"
                  : form.tipoIndicacao === "Conteúdo"
                  ? "Ex.: Canal com conteúdos práticos e atualizados sobre QA"
                  : form.tipoIndicacao === "Comunidade"
                  ? "Ex.: Comunidade colaborativa e com eventos frequentes"
                  : form.tipoIndicacao === "Educação"
                  ? "Ex.: Formação completa, com instrutores qualificados e abordagem prática"
                  : "Título da referência"
              }
              className={`${field} h-[42px] ${tentouEnviar && !form.titulo ? 'border-red-500' : form.titulo ? 'border-green-500' : ''}`}
              required
            />
            {tentouEnviar && !form.titulo && (
              <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
            )}
          </div>
        )}

        {form.tipoIndicacao === "Educação" && (
          <>
            <div>
              <label htmlFor="nome" className="block mb-1 font-medium">
                Nome do Curso/Formação <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex.: QA Profissional, Domine Cypress, etc."
                className={`${field} h-[42px] ${tentouEnviar && !form.nome ? 'border-red-500' : form.nome ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.nome && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            <div>
              <label htmlFor="empresaOuResponsavel" className="block mb-1 font-medium">
                Instituição de Ensino ou Instrutor Responsável <span className="text-red-500">*</span>
              </label>
              <input
                id="empresaOuResponsavel"
                type="text"
                name="empresaOuResponsavel"
                value={form.empresaOuResponsavel}
                onChange={handleChange}
                placeholder="Quem vende/oferece"
                className={`${field} h-[42px] ${tentouEnviar && !form.empresaOuResponsavel ? 'border-red-500' : form.empresaOuResponsavel ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.empresaOuResponsavel && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            {/* CAMPO: Link oficial (site, página de vendas, etc.) */}
            <div>
              <label htmlFor="valor" className="block mb-1 font-medium">
                Link oficial (site, página de vendas, etc.)
              </label>
              <input
                id="valor"
                type="url"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                placeholder="https://exemplo.com/curso"
                className={`${field} ${form.valor ? 'border-green-500' : ''}`}
              />
            </div>

            {/* NOVO BLOCO DE CAMPOS: Tipo, Área, Especialidade, Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo" className="block mb-1 font-medium">
                  Tipo <span className="text-red-500">*</span>
                </label>
              <select
                id="tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className={`${field} h-[42px] ${tentouEnviar && !form.tipo ? 'border-red-500' : form.tipo ? 'border-green-500' : ''}`}
                required
              >
                <option value="">Selecione...</option>
                <option value="curso">Curso</option>
                <option value="mentoria">Mentoria</option>
                <option value="ebook">E-book</option>
                <option value="certificacao">Certificação</option>
                <option value="workshop">Workshop</option>
                <option value="outro">Outro</option>
              </select>
              {tentouEnviar && !form.tipo && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
                {form.tipo === "outro" && (
                  <div className="mt-2">
                    <label htmlFor="tipoOutro" className="block mb-1 font-medium">
                      Qual outro tipo?
                    </label>
                    <input
                      id="tipoOutro"
                      type="text"
                      name="tipoOutro"
                      value={form.tipoOutro}
                      onChange={handleChange}
                      placeholder="Ex.: Imersão, Comunidade, etc."
                      className={`${field} h-[42px] ${form.tipoOutro ? 'border-green-500' : ''}`}
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="area" className="block mb-1 font-medium">
                  Área <span className="text-red-500">*</span>
                </label>
                <select
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className={`${field} h-[42px] ${tentouEnviar && !form.area ? 'border-red-500' : form.area ? 'border-green-500' : ''}`}
                  required
                >
                  <option value="">Selecione...</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {tentouEnviar && !form.area && (
                  <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
                )}
              </div>
            </div>

            {form.area === "Outro" && (
              <div className="mt-2">
                <label htmlFor="areaOutra" className="block mb-1 font-medium">
                  Qual área?
                </label>
                <input
                  id="areaOutra"
                  type="text"
                  name="areaOutra"
                  value={form.areaOutra}
                  onChange={handleChange}
                  placeholder="Ex.: Marketing Tech, Educação, etc."
                  className={`${field} h-[42px] ${form.areaOutra ? 'border-green-500' : ''}`}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="especialidade" className="block mb-1 font-medium">
                  Especialidade
                </label>
                <input
                  id="especialidade"
                  type="text"
                  name="especialidade"
                  value={form.especialidade}
                  onChange={handleChange}
                  placeholder="Ex.: Mentoria com foco em iniciantes"
                  className={`${field} h-[42px] ${tentouEnviar && !form.especialidade ? 'border-red-500' : form.especialidade ? 'border-green-500' : ''}`}
                />
              </div>
              <div>
                <label htmlFor="valor" className="block mb-1 font-medium">
                  Valor pago (R$)
                </label>
              <input
                id="valor"
                type="number"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                placeholder="Opcional"
                min="0"
                step="0.01"
                className={`${field} ${form.valor ? 'border-green-500' : ''}`}
              />
              </div>
            </div>
            {/* FIM DO NOVO BLOCO */}
          </>
        )}

        {form.tipoIndicacao === "Profissional" && (
          <>
            {/* Frase descritiva já está no campo titulo acima */}
            <div>
              <label htmlFor="nome" className="block mb-1 font-medium">
                Nome completo do profissional <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex.: Maria Silva"
                className={`${field} h-[42px] ${tentouEnviar && !form.nome ? 'border-red-500' : form.nome ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.nome && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            <div>
              <label htmlFor="empresaOuResponsavel" className="block mb-1 font-medium">
                Onde atua (empresa, comunidade, etc.) <span className="text-red-500">*</span>
              </label>
              <input
                id="empresaOuResponsavel"
                type="text"
                name="empresaOuResponsavel"
                value={form.empresaOuResponsavel}
                onChange={handleChange}
                placeholder="Ex.: XPTO Tecnologia, Comunidade QA Brasil, Freelancer"
                className={`${field} h-[42px] ${tentouEnviar && !form.empresaOuResponsavel ? 'border-red-500' : form.empresaOuResponsavel ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.empresaOuResponsavel && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="area" className="block mb-1 font-medium">
                  Área de Atuação
                </label>
                <select
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className={`${field} h-[42px] ${tentouEnviar && !form.area ? 'border-red-500' : form.area ? 'border-green-500' : ''}`}
                  required
                >
                  <option value="">Selecione...</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {tentouEnviar && !form.area && (
                  <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
                )}
              </div>
              {form.area === "Outro" && (
                <div>
                  <label htmlFor="areaOutra" className="block mb-1 font-medium">
                    Qual área?
                  </label>
                  <input
                    id="areaOutra"
                    type="text"
                    name="areaOutra"
                    value={form.areaOutra}
                    onChange={handleChange}
                    placeholder="Ex.: RH/Tecnologia, Freelancer, etc."
                    className={`${field} h-[42px]`}
                  />
                </div>
              )}
              {/* Especialidade - campo novo após Área */}
              <div>
                <label htmlFor="especialidade" className="block mb-1 font-medium">
                  Especialidade
                </label>
                <input
                  id="especialidade"
                  type="text"
                  name="especialidade"
                  value={form.especialidade || ""}
                  onChange={handleChange}
                  placeholder="Ex.: QA Funcional, Automação de Testes, Performance"
                  className={`${field} h-[42px] ${tentouEnviar && !form.especialidade ? 'border-red-500' : form.especialidade ? 'border-green-500' : ''}`}
                />
              </div>
            </div>
            {/* Campo de link do perfil (LinkedIn, GitHub, etc.) movido para cá */}
            <div>
              <label htmlFor="link" className="block mb-1 font-medium">
                Link do perfil (LinkedIn, GitHub, etc.)
              </label>
              <input
                id="link"
                type="url"
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/exemplo"
                className={`${field} ${form.link ? 'border-green-500' : ''}`}
              />
            </div>
            <div>
              <label htmlFor="descricao" className="block mb-1 font-medium">
                Justificativa da indicação <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Fale sobre seu contato com esse profissional, qualidades, resultados ou contexto de atuação"
                rows={6}
                className={`${field} ${tentouEnviar && !form.descricao ? 'border-red-500' : form.descricao ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.descricao && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            {form.natureza === "positiva" && (
              <div>
                <label className="block mb-1 font-medium">
                  Pontos fortes deste profissional
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Comunicação clara",
                    "Conhecimento técnico",
                    "Cumpre prazos",
                    "Responsável e ético",
                    "Didática ou clareza ao explicar",
                    "Proatividade",
                    "Empatia e escuta ativa",
                    "Trabalho em equipe",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Bloco - aspectos negativos para Profissional */}
            {form.natureza === "negativa" && form.tipoIndicacao === "Profissional" && (
              <div>
                <label className="block mb-1 font-medium">
                  O que você considera que foi negativo?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Falta de pontualidade ou comprometimento",
                    "Problemas de comunicação",
                    "Falta de conhecimento técnico",
                    "Posturas antiéticas",
                    "Dificuldade de trabalho em equipe",
                    "Condutas inadequadas em público ou redes sociais",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {form.tipoIndicacao === "Empresa" && (
          <>
            <div>
              <label htmlFor="nome" className="block mb-1 font-medium">
                Nome da Empresa <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex.: Tech Solutions Ltda"
                className={`${field} h-[42px] ${tentouEnviar && !form.nome ? 'border-red-500' : form.nome ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.nome && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            {/* Bloco de Área de Atuação, Qual área?, Especialidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="area" className="block mb-1 font-medium">
                  Área de Atuação
                </label>
                <select
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className={`${field} h-[42px] ${tentouEnviar && !form.area ? 'border-red-500' : form.area ? 'border-green-500' : ''}`}
                  required
                >
                  <option value="">Selecione...</option>
                  {AREAS_EMPRESA.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {tentouEnviar && !form.area && (
                  <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
                )}
              </div>
              {/* Qual área? só aparece se área == Outro */}
              {form.area === "Outro" ? (
                <div>
                  <label htmlFor="areaOutra" className="block mb-1 font-medium">
                    Qual área?
                  </label>
                  <input
                    id="areaOutra"
                    type="text"
                    name="areaOutra"
                    value={form.areaOutra}
                    onChange={handleChange}
                    placeholder="Ex.: Marketing Tech, Educação, etc."
                    className={`${field} h-[42px]`}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="especialidade" className="block mb-1 font-medium">
                    Especialidade ou segmento
                  </label>
                  <input
                    id="especialidade"
                    type="text"
                    name="especialidade"
                    value={form.especialidade || ""}
                    onChange={handleChange}
                    placeholder="Ex.: Consultoria ágil, Desenvolvimento de plataformas educacionais"
                    className={`${field} h-[42px] ${tentouEnviar && !form.especialidade ? 'border-red-500' : form.especialidade ? 'border-green-500' : ''}`}
                  />
                </div>
              )}
            </div>
            {/* Se área == Outro, mostra Especialidade/segmento abaixo */}
            {form.area === "Outro" && (
              <div className="mt-2">
                <label htmlFor="especialidade" className="block mb-1 font-medium">
                  Especialidade ou segmento
                </label>
                <input
                  id="especialidade"
                  type="text"
                  name="especialidade"
                  value={form.especialidade || ""}
                  onChange={handleChange}
                  placeholder="Ex.: Consultoria ágil, Desenvolvimento de plataformas educacionais"
                  className={`${field} h-[42px] ${tentouEnviar && !form.especialidade ? 'border-red-500' : form.especialidade ? 'border-green-500' : ''}`}
                />
              </div>
            )}
            {/* Novo campo: Atuação geográfica */}
            <div className="mt-2">
              <label htmlFor="tipo" className="block mb-1 font-medium">
                Atuação geográfica <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className={`${field} h-[42px] ${tentouEnviar && !form.tipo ? 'border-red-500' : form.tipo ? 'border-green-500' : ''}`}
                required
              >
                <option value="">Selecione...</option>
                <option value="Nacional">Nacional</option>
                <option value="Internacional">Estrangeira</option>
                <option value="Ambos">Multinacional com atuação no Brasil</option>
                <option value="Outro">Outro</option>
              </select>
              {tentouEnviar && !form.tipo && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            {/* Campo de link institucional */}
            <div className="mt-2">
              <label htmlFor="link" className="block mb-1 font-medium">
                Link institucional ou site da empresa
              </label>
              <input
                id="link"
                type="url"
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="https://empresa.com.br"
                className={`${field} ${form.link ? 'border-green-500' : ''}`}
              />
            </div>
            <div>
              <label htmlFor="descricao" className="block mb-1 font-medium">
                Por que você está indicando esta empresa? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Fale sobre a experiência com a empresa, valores percebidos, ambiente ou resultados"
                rows={6}
                className={`${field} ${tentouEnviar && !form.descricao ? 'border-red-500' : form.descricao ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.descricao && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>

            {/* Bloco - aspectos negativos ou positivos para Empresa */}
            {form.natureza === "negativa" && form.tipoIndicacao === "Empresa" && (
              <div>
                <label className="block mb-1 font-medium">
                  O que você considera que foi negativo?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Comunicação difícil ou lenta",
                    "Falta de transparência",
                    "Ambiente tóxico ou desorganizado",
                    "Desrespeito com profissionais ou clientes",
                    "Práticas antiéticas",
                    "Foco excessivo em vendas ou marketing",
                    "Promessas não cumpridas",
                    "Falta de apoio ou suporte",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {form.natureza === "positiva" && form.tipoIndicacao === "Empresa" && (
              <div>
                <label className="block mb-1 font-medium">
                  O que você considera que foi positivo?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Comunicação clara e eficiente",
                    "Transparência nas relações",
                    "Cumprimento do que promete",
                    "Ambiente saudável e colaborativo",
                    "Apoio e suporte ao cliente/profissional",
                    "Responsabilidade social e ética",
                    "Valorização da qualidade e inovação",
                    "Facilidade de contato e resolução de problemas",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {form.tipoIndicacao === "Conteúdo" && (
          <>
            <div>
              <label htmlFor="nome" className="block mb-1 font-medium">
                Nome do Canal, Perfil, Blog, Podcast, etc. <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex.: Testando com Qualidade"
                className={`${field} h-[42px] ${tentouEnviar && !form.nome ? 'border-red-500' : form.nome ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.nome && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            <div>
              <label htmlFor="empresaOuResponsavel" className="block mb-1 font-medium">
                Responsável/Autor <span className="text-red-500">*</span>
              </label>
              <input
                id="empresaOuResponsavel"
                type="text"
                name="empresaOuResponsavel"
                value={form.empresaOuResponsavel}
                onChange={handleChange}
                placeholder="Quem cria ou mantém esse conteúdo"
                className={`${field} h-[42px] ${tentouEnviar && !form.empresaOuResponsavel ? 'border-red-500' : form.empresaOuResponsavel ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.empresaOuResponsavel && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            {/* Bloco: Tipo + Área */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo" className="block mb-1 font-medium">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <input
                  id="tipo"
                  type="text"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  placeholder="Ex.: Canal no YouTube, Podcast, Blog, etc."
                  className={`${field} h-[42px] ${tentouEnviar && !form.tipo ? 'border-red-500' : form.tipo ? 'border-green-500' : ''}`}
                  required
                />
                {tentouEnviar && !form.tipo && (
                  <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
                )}
              </div>
              <div>
                <label htmlFor="area" className="block mb-1 font-medium">
                  Área de Interesse
                </label>
                <select
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className={`${field} h-[42px] ${tentouEnviar && !form.area ? 'border-red-500' : form.area ? 'border-green-500' : ''}`}
                  required
                >
                  <option value="">Selecione...</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {tentouEnviar && !form.area && (
                  <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
                )}
              </div>
            </div>
            {form.area === "Outro" && (
              <div>
                <label htmlFor="areaOutra" className="block mb-1 font-medium">
                  Qual área?
                </label>
                <input
                  id="areaOutra"
                  type="text"
                  name="areaOutra"
                  value={form.areaOutra}
                  onChange={handleChange}
                  placeholder="Ex.: Marketing Tech, Educação, etc."
                  className={`${field} h-[42px]`}
                />
              </div>
            )}
            {/* Especialidade visível apenas para tipoIndicacao === "Conteúdo" */}
            <div>
              <label htmlFor="especialidade" className="block mb-1 font-medium">
                Formato ou Especialidade
              </label>
              <input
                id="especialidade"
                type="text"
                name="especialidade"
                value={form.especialidade || ""}
                onChange={handleChange}
                placeholder="Ex.: Vídeos semanais com estudos de caso"
                className={`${field} h-[42px] ${tentouEnviar && !form.especialidade ? 'border-red-500' : form.especialidade ? 'border-green-500' : ''}`}
              />
            </div>
            {/* Adicionado campo de link do conteúdo */}
            <div>
              <label htmlFor="valor" className="block mb-1 font-medium">
                Link do conteúdo (YouTube, blog, podcast, etc.)
              </label>
              <input
                id="valor"
                type="url"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                placeholder="https://youtube.com/@exemplo ou https://blog.exemplo.com"
                className={`${field} ${form.valor ? 'border-green-500' : ''}`}
              />
            </div>
            <div>
              <label htmlFor="descricao" className="block mb-1 font-medium">
                Por que você está indicando este conteúdo? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Fale sobre a qualidade, relevância e utilidade do conteúdo"
                rows={6}
                className={`${field} ${tentouEnviar && !form.descricao ? 'border-red-500' : form.descricao ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.descricao && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            {/* Bloco de aspectos positivos para Conteúdo */}
            {form.natureza === "positiva" && (
              <div>
                <label className="block mb-1 font-medium">
                  O que você considera que foi positivo?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Conteúdo claro e aplicável",
                    "Instrutor com boa didática",
                    "Material atualizado",
                    "Consistência nas publicações",
                    "Engajamento com a comunidade",
                    "Formato acessível e atrativo",
                    "Relevância dos temas abordados",
                    "Didática e clareza na explicação",
                    "Convidados relevantes (se for podcast/canal)",
                    "Fonte de aprendizado contínuo",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {/* Bloco de aspectos negativos para Conteúdo */}
            {form.natureza === "negativa" && form.tipoIndicacao === "Conteúdo" && (
              <div>
                <label className="block mb-1 font-medium">
                  O que você considera que foi negativo?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Conteúdo desatualizado ou incorreto",
                    "Excesso de marketing ou autopromoção",
                    "Frequência de publicações muito baixa",
                    "Falta de profundidade ou clareza",
                    "Pouco alinhamento com a realidade do mercado",
                    "Dificuldade de acesso ou navegação",
                    "Falta de fontes confiáveis ou referências",
                    "Comentários ou interações tóxicas",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {form.tipoIndicacao === "Comunidade" && (
          <>
            <div>
              <label htmlFor="nome" className="block mb-1 font-medium">
                Nome da Comunidade <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex.: QA Brasil"
                className={`${field} h-[42px] ${tentouEnviar && !form.nome ? 'border-red-500' : form.nome ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.nome && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            <div>
              <label htmlFor="empresaOuResponsavel" className="block mb-1 font-medium">
                Responsável/Coordenador <span className="text-red-500">*</span>
              </label>
              <input
                id="empresaOuResponsavel"
                type="text"
                name="empresaOuResponsavel"
                value={form.empresaOuResponsavel}
                onChange={handleChange}
                placeholder="Quem lidera ou representa essa comunidade"
                className={`${field} h-[42px] ${tentouEnviar && !form.empresaOuResponsavel ? 'border-red-500' : form.empresaOuResponsavel ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.empresaOuResponsavel && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo" className="block mb-1 font-medium">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <input
                  id="tipo"
                  type="text"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  placeholder="Ex.: Meetup, Fórum, Comunidade no Discord, etc."
                  className={`${field} h-[42px] ${tentouEnviar && !form.tipo ? 'border-red-500' : form.tipo ? 'border-green-500' : ''}`}
                  required
                />
                {tentouEnviar && !form.tipo && (
                  <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
                )}
              </div>
              <div>
                <label htmlFor="area" className="block mb-1 font-medium">
                  Área de Atuação
                </label>
                <select
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className={`${field} h-[42px] ${tentouEnviar && !form.area ? 'border-red-500' : form.area ? 'border-green-500' : ''}`}
                  required
                >
                  <option value="">Selecione...</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {tentouEnviar && !form.area && (
                  <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
                )}
              </div>
            </div>
            {form.area === "Outro" && (
              <div>
                <label htmlFor="areaOutra" className="block mb-1 font-medium">
                  Qual área?
                </label>
                <input
                  id="areaOutra"
                  type="text"
                  name="areaOutra"
                  value={form.areaOutra}
                  onChange={handleChange}
                  placeholder="Ex.: Marketing Tech, Educação, etc."
                  className={`${field} h-[42px]`}
                />
              </div>
            )}
            <div>
              <label htmlFor="especialidade" className="block mb-1 font-medium">
                Especialidade
              </label>
              <input
                id="especialidade"
                type="text"
                name="especialidade"
                value={form.especialidade || ""}
                onChange={handleChange}
                placeholder="Ex.: Grupo no WhatsApp e encontros mensais"
                className={`${field} h-[42px] ${tentouEnviar && !form.especialidade ? 'border-red-500' : form.especialidade ? 'border-green-500' : ''}`}
              />
            </div>
            <div>
              <label htmlFor="link" className="block mb-1 font-medium">
                Link da comunidade
              </label>
              <input
                id="link"
                type="url"
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="https://meetup.com/comunidade"
                className={`${field} ${form.link ? 'border-green-500' : ''}`}
              />
            </div>
            <div>
              <label htmlFor="descricao" className="block mb-1 font-medium">
                Por que você está indicando esta comunidade? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Fale sobre o ambiente, pessoas, eventos ou impacto gerado"
                rows={6}
                className={`${field} ${tentouEnviar && !form.descricao ? 'border-red-500' : form.descricao ? 'border-green-500' : ''}`}
                required
              />
              {tentouEnviar && !form.descricao && (
                <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
              )}
            </div>
            {/* NOVOS CAMPOS DE ASPECTOS POSITIVOS/NEGATIVOS PARA COMUNIDADE */}
            {form.natureza === "positiva" && (
              <div>
                <label className="block mb-1 font-medium">
                  O que você considera que foi positivo?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Ambiente saudável e colaborativo",
                    "Apoio e suporte ao profissional",
                    "Eventos regulares e bem organizados",
                    "Conteúdo relevante compartilhado",
                    "Abertura para todos os níveis de carreira",
                    "Participação ativa dos membros",
                    "Representatividade e inclusão",
                    "Valorização da qualidade e inovação",
                    "Networking e oportunidades de carreira",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {form.natureza === "negativa" && (
              <div>
                <label className="block mb-1 font-medium">
                  O que você considera que foi negativo?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Falta de organização nos encontros",
                    "Comunicação ineficaz ou ausente",
                    "Ambiente hostil ou pouco acolhedor",
                    "Desinformação ou conteúdo irrelevante",
                    "Exclusão de iniciantes ou novatos",
                    "Falta de diversidade e representatividade",
                    "Foco excessivo em autopromoção",
                    "Dificuldade de engajamento",
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        value={item}
                        checked={form.aspectosNegativos.includes(item)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            aspectosNegativos: checked
                              ? [...prev.aspectosNegativos, item]
                              : prev.aspectosNegativos.filter((i) => i !== item),
                          }));
                        }}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}


        {/* O campo descricao foi movido para os blocos de Empresa, Conteúdo e Comunidade com labels/placeholder específicos */}

        {form.tipoIndicacao === "Educação" && (
          <div>
            <label htmlFor="descricao" className="block mb-1 font-medium">
              Por que você está indicando este curso/mentoria/etc? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Fale sobre a experiência, pontos positivos ou negativos, e como isso impactou você"
              rows={6}
              className={`${field} ${tentouEnviar && !form.descricao ? 'border-red-500' : form.descricao ? 'border-green-500' : ''}`}
              required
            />
            {tentouEnviar && !form.descricao && (
              <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>
            )}
          </div>
        )}

        {form.natureza === "negativa" && form.tipoIndicacao === "Educação" && (
          <div>
            <label className="block mb-1 font-medium">
              O que você considera que foi negativo?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Falta de suporte",
                "Conteúdo superficial ou genérico",
                "Promessas não cumpridas",
                "Cobrança abusiva",
                "Pressão para comprar outros produtos",
                "Foco excessivo em marketing",
                "Desorganização da plataforma ou agenda",
                "Material desatualizado ou mal produzido",
                "Feedbacks genéricos ou inexistentes",
                "Não cumprimento do que foi vendido",
              ].map((item) => (
                <label key={item} className="flex items-center">
                  <input
                    type="checkbox"
                    value={item}
                    checked={form.aspectosNegativos.includes(item)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        aspectosNegativos: checked
                          ? [...prev.aspectosNegativos, item]
                          : prev.aspectosNegativos.filter((i) => i !== item),
                      }));
                    }}
                    className="mr-2"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        )}

        {form.natureza === "positiva" && form.tipoIndicacao === "Educação" && (
          <div>
            <label className="block mb-1 font-medium">
              O que você considera que foi positivo?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Conteúdo claro e aplicável",
                "Instrutor com boa didática",
                "Material complementar de qualidade",
                "Acesso fácil e organizado",
                "Suporte presente e eficiente",
                "Boa relação custo-benefício",
                "Cumprimento do que foi prometido",
                "Acompanhamento individual ou em grupo",
                "Feedbacks construtivos",
                "Experiência transformadora",
              ].map((item) => (
                <label key={item} className="flex items-center">
                  <input
                    type="checkbox"
                    value={item}
                    checked={form.aspectosNegativos.includes(item)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        aspectosNegativos: checked
                          ? [...prev.aspectosNegativos, item]
                          : prev.aspectosNegativos.filter((i) => i !== item),
                      }));
                    }}
                    className="mr-2"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          {/* Botão de envio com acessibilidade e cursor not-allowed quando desabilitado */}
          {(() => {
            const disabled =
              !form.tipoIndicacao ||
              !form.titulo ||
              !form.nome ||
              !form.empresaOuResponsavel ||
              !form.descricao;
            const title = disabled
              ? "Preencha todos os campos obrigatórios"
              : "Enviar referência";
            if (disabled) {
              return (
                <div className="relative group inline-block">
                  <button
                    type="submit"
                    className={`btn-action opacity-50 cursor-not-allowed`}
                    disabled
                    style={{ cursor: "not-allowed" }}
                  >
                    Enviar referência
                  </button>
                  <p className="absolute left-0 mt-2 text-sm text-red-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    ⚠️ Preencha todos os campos obrigatórios para enviar a referência.
                  </p>
                </div>
              );
            }
            return (
              <button
                type="submit"
                className="btn-action"
                title={title}
                aria-label={title}
              >
                Enviar referência
              </button>
            );
          })()}
        </div>
      </form>
    </div>
  );
}