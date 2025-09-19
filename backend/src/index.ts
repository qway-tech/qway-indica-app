import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // Se estiver usando Node <18
import type { Request, Response } from "express";

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

interface GoogleUserResponse {
  name: string;
  email: string;
  picture: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  login: string;
  name: string | null;
  email: string | null;
}

const app = express();
const PORT = process.env.PORT || 4001;
const API_BASE_URL = process.env.API_BASE_URL;

// Constantes para evitar repetições
const OWNER = "qway-tech";
const REPO = "qway-indica-dados";
const BRANCH = "main";
const GITHUB_API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const allowedOrigins = [
  'http://localhost:5174',
  'https://academy.qway.com.br',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.post("/auth/:provider/token", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code, code_verifier } = req.body;

  let tokenUrl = "";
  let clientId = "";
  let clientSecret = "";
  let redirectUri = "http://localhost:5174/auth/callback";

  if (provider === "google") {
    tokenUrl = "https://oauth2.googleapis.com/token";
    clientId = process.env.GOOGLE_CLIENT_ID || "";
    clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    try {
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code_verifier,
        }),
      });

      const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

      if (!tokenData.access_token) {
        return res.status(400).json({ error: "Token inválido", details: tokenData });
      }

      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = (await userRes.json()) as GoogleUserResponse;

      return res.json({
        access_token: tokenData.access_token,
        user: {
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        },
      });
    } catch (err) {
      console.error("Erro ao autenticar com Google:", err);
      return res.status(500).json({ error: "Erro ao autenticar com Google" });
    }
  } else if (provider === "github") {
    tokenUrl = "https://github.com/login/oauth/access_token";
    clientId = process.env.GITHUB_CLIENT_ID || "";
    clientSecret = process.env.GITHUB_CLIENT_SECRET || "";

    try {
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = (await tokenRes.json()) as GitHubTokenResponse;

      if (!tokenData.access_token) {
        return res.status(400).json({ error: "Token inválido", details: tokenData });
      }

      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      });

      const userData = (await userRes.json()) as GitHubUserResponse;

      return res.json({
        access_token: tokenData.access_token,
        user: {
          name: userData.name ?? userData.login,
          email: userData.email ?? "sem-email@github.com",
        },
      });
    } catch (err) {
      console.error("Erro ao autenticar com GitHub:", err);
      return res.status(500).json({ error: "Erro ao autenticar com GitHub" });
    }
  } else {
    return res.status(400).json({ error: "Provedor de autenticação inválido." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em ${API_BASE_URL}`);
});


app.post("/registrar-referencia", async (req: Request, res: Response) => {
  const { natureza, conteudo } = req.body;

  // Verificação de estrutura
  if (!["positiva", "negativa"].includes(natureza) || !conteudo || typeof conteudo !== "object") {
    return res.status(400).json({ error: "Requisição inválida" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const folder = `referencias/${natureza === "positiva" ? "positivas" : "negativas"}`;
  const url = `${GITHUB_API}/contents/${folder}`;

  try {
    // Buscar lista de arquivos já existentes
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error("Falha ao acessar o repositório");

    const files = (await r.json()) as { name: string }[];
    const prefix = natureza === "positiva" ? "pos" : "neg";

    const numeros = files
      .map(f => Number(f.name.replace(`${prefix}-`, "").replace(".json", "")))
      .filter(n => !isNaN(n));

    const nextNumber = (Math.max(...numeros, 0)) + 1;
    const id = `${prefix}-${String(nextNumber).padStart(4, "0")}`;
    const path = `${folder}/${id}.json`;
    const commitUrl = `${GITHUB_API}/contents/${path}`;

    // Estrutura final do conteúdo com ID, natureza e dataRegistro
    const final = {
      ...conteudo,
      id,
      natureza,
      dataRegistro: new Date().toISOString()
    };

    const payload = {
      message: `Nova referência ${id}`,
      content: Buffer.from(JSON.stringify(final, null, 2)).toString("base64"),
      branch: BRANCH,
    };

    const put = await fetch(commitUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (!put.ok) {
      const msg = await put.text();
      throw new Error("Erro ao salvar: " + msg);
    }

    return res.json({ sucesso: true, id });
  } catch (err: any) {
    console.error("Erro:", err);
    return res.status(500).json({ error: "Erro ao registrar referência", details: err?.message });
  }
});

app.post("/registrar-comentario", async (req: Request, res: Response) => {
  const { referenciaId, natureza, comentario } = req.body;

  if (!referenciaId || !natureza || !comentario || !comentario.email || !comentario.texto) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes ou inválidos" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const commentPath = `referencias/${natureza === "positiva" ? "positivas" : "negativas"}/comentarios/${referenciaId}.json`;
  const commentUrl = `${GITHUB_API}/contents/${commentPath}`;

  try {
    const novoComentario = {
      autor: comentario.autor || "Anônimo",
      texto: comentario.texto,
      email: comentario.email,
      data: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    };

    let comentarios: any[] = [];
    let sha: string | undefined;

    const r = await fetch(commentUrl, { headers });
    if (r.ok) {
      const jsonData = (await r.json()) as { content: string; sha: string };
      const content = Buffer.from(jsonData.content, 'base64').toString('utf-8');
      comentarios = JSON.parse(content);
      sha = jsonData.sha;
    }

    comentarios.push(novoComentario);

    const payload: any = {
      message: `Novo comentário em ${referenciaId}`,
      content: Buffer.from(JSON.stringify(comentarios, null, 2)).toString("base64"),
      branch: BRANCH,
    };

    if (r.ok && sha) {
      payload.sha = sha;
    }

    const put = await fetch(commentUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    // Validação: só retorna sucesso se o arquivo foi realmente alterado
    if (!put.ok) {
      const msg = await put.text();
      // Log detalhado do erro, mas não retorna 200 para o frontend
      console.error("Erro ao salvar comentário (PUT falhou):", msg);
      return res.status(500).json({ error: "Erro ao registrar comentário", details: msg });
    }

    // Se chegou aqui, PUT foi bem-sucedido
    return res.json({ sucesso: true });
  } catch (err: any) {
    // Log do erro, mas retorna erro explícito
    console.error("Erro ao registrar comentário (catch):", err);
    return res.status(500).json({ error: "Erro ao registrar comentário", details: err?.message });
  }
});

app.post("/registrar-voto", async (req: Request, res: Response) => {
  const { referenciaId, natureza, voto } = req.body;

  if (!referenciaId || !natureza || !voto?.email) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const votosPath = `referencias/${natureza === "positiva" ? "positivas" : "negativas"}/votos/${referenciaId}.json`;
  const votosUrl = `${GITHUB_API}/contents/${votosPath}`;

  try {
    const novoVoto = {
      email: voto.email,
      data: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    };

    let votos: any[] = [];
    let sha: string | undefined;

    const r = await fetch(votosUrl, { headers });
    if (r.ok) {
      const jsonData = (await r.json()) as { content: string; sha: string };
      const content = Buffer.from(jsonData.content, 'base64').toString('utf-8');
      votos = JSON.parse(content);
      sha = jsonData.sha;

      if (votos.some(v => v.email === voto.email)) {
        return res.status(409).json({ error: "Usuário já votou" });
      }
    }

    votos.push(novoVoto);

    const payload: any = {
      message: `Novo voto em ${referenciaId}`,
      content: Buffer.from(JSON.stringify(votos, null, 2)).toString("base64"),
      branch: BRANCH,
    };

    if (sha) {
      payload.sha = sha;
    }

    const put = await fetch(votosUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (!put.ok) {
      const msg = await put.text();
      throw new Error("Erro ao salvar voto: " + msg);
    }

    return res.json({ sucesso: true });
  } catch (err: any) {
    console.error("Erro ao registrar voto:", err);
    return res.status(500).json({ error: "Erro ao registrar voto", details: err?.message });
  }
});


app.post("/remover-voto", async (req: Request, res: Response) => {
  const { referenciaId, email } = req.body;

  if (!referenciaId || !email) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const votosPath = `referencias/${referenciaId.startsWith("pos-") ? "positivas" : "negativas"}/votos/${referenciaId}.json`;
  const votosUrl = `${GITHUB_API}/contents/${votosPath}`;

  try {
    const r = await fetch(votosUrl, { headers });

    if (!r.ok) {
      return res.status(404).json({ error: "Votos não encontrados para esta referência" });
    }

    const jsonData = (await r.json()) as { content: string; sha: string };
    const content = Buffer.from(jsonData.content, "base64").toString("utf-8");
    let votos = JSON.parse(content) as { email: string; data: string }[];
    const sha = jsonData.sha;

    const votosFiltrados = votos.filter(v => v.email !== email);

    const payload = {
      message: `Remoção de voto em ${referenciaId}`,
      content: Buffer.from(JSON.stringify(votosFiltrados, null, 2)).toString("base64"),
      branch: BRANCH,
      sha,
    };

    const put = await fetch(votosUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (!put.ok) {
      const msg = await put.text();
      throw new Error("Erro ao remover voto: " + msg);
    }

    return res.json({ sucesso: true });
  } catch (err: any) {
    console.error("Erro ao remover voto:", err);
    return res.status(500).json({ error: "Erro ao remover voto", details: err?.message });
  }
});

// Nova rota: GET /comentarios?referenciaId=...&natureza=...
app.get("/comentarios", async (req: Request, res: Response) => {
  const referenciaId = req.query.referenciaId as string;
  const natureza = req.query.natureza as string;

  if (!referenciaId || !natureza) {
    return res.status(400).json({ error: "Parâmetros referenciaId e natureza são obrigatórios." });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const commentPath = `referencias/${natureza === "positiva" ? "positivas" : "negativas"}/comentarios/${referenciaId}.json`;
  const commentUrl = `${GITHUB_API}/contents/${commentPath}`;

  try {
    const r = await fetch(commentUrl, { headers });
    if (!r.ok) {
      // Se não existe ainda, retorna array vazio
      return res.json([]);
    }
    const jsonData = (await r.json()) as { content: string; sha: string };
    const content = Buffer.from(jsonData.content, 'base64').toString('utf-8');
    const comentarios = JSON.parse(content);
    return res.json(comentarios);
  } catch (err: any) {
    console.error("Erro ao buscar comentários:", err);
    return res.status(500).json({ error: "Erro ao buscar comentários", details: err?.message });
  }
});
// Nova rota para servir o conteúdo bruto de arquivos do repositório GitHub, resolvendo problemas de CORS no frontend
app.get("/conteudo-arquivo", async (req: Request, res: Response) => {
  const path = req.query.path;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: "Caminho inválido" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const rawUrl = `${GITHUB_API}/contents/${path}`;

  try {
    const r = await fetch(rawUrl, { headers });
    if (!r.ok) return res.status(404).json({ error: "Arquivo não encontrado" });

    const jsonData = await r.json() as { content?: string; sha?: string };

    if (Array.isArray(jsonData)) {
      // Caso seja um diretório: retorna lista de arquivos
      return res.json(jsonData);
    }

    if (jsonData.content) {
      // Caso seja um arquivo: decodifica e retorna
      const content = Buffer.from(jsonData.content, 'base64').toString('utf-8');
      return res.type("application/json").send(content);
    }

    // Caso não seja nem diretório nem arquivo com conteúdo conhecido
    return res.status(500).json({ error: "Formato de conteúdo inesperado" });
  } catch (err: any) {
    console.error("Erro ao buscar conteúdo do arquivo:", err);
    return res.status(500).json({ error: "Erro ao buscar conteúdo do arquivo", details: err?.message });
  }
});
// Nova rota: lista arquivos em um diretório. Ex: /listar-arquivos?path=referencias/positivas/votos
app.get("/listar-arquivos", async (req: Request, res: Response) => {
  // Verifica e decodifica o parâmetro path para aceitar caracteres especiais e espaços
  const path = req.query.path;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: "Parâmetro path é obrigatório e deve ser uma string válida" });
  }
  const decodedDiretorio = decodeURIComponent(path);

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const url = `${GITHUB_API}/contents/${decodedDiretorio}`;

  try {
    const r = await fetch(url, { headers });
    if (!r.ok) {
      return res.status(r.status).json({ error: "Erro ao buscar diretório", details: await r.text() });
    }

    const json = await r.json();
    return res.json(json);
  } catch (err: any) {
    console.error("Erro ao listar arquivos:", err);
    return res.status(500).json({ error: "Erro ao listar arquivos", details: err?.message });
  }
});
// Nova rota: DELETE /remover-comentario
app.delete("/remover-comentario", async (req: Request, res: Response) => {
  const { referenciaId, natureza, comentarioIndex, email } = req.body;

  if (
    !referenciaId ||
    !natureza ||
    comentarioIndex === undefined ||
    comentarioIndex < 0 ||
    !email
  ) {
    return res
      .status(400)
      .json({ error: "Parâmetros obrigatórios ausentes ou inválidos" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const commentPath = `referencias/${
    natureza === "positiva" ? "positivas" : "negativas"
  }/comentarios/${referenciaId}.json`;
  const commentUrl = `${GITHUB_API}/contents/${commentPath}`;

  try {
    const r = await fetch(commentUrl, { headers });

    if (!r.ok) {
      return res.status(404).json({ error: "Arquivo de comentários não encontrado" });
    }

    const jsonData = (await r.json()) as { content: string; sha: string };
    const content = Buffer.from(jsonData.content, "base64").toString("utf-8");
    const comentarios = JSON.parse(content) as {
      email: string;
      texto: string;
      autor: string;
      data: string;
    }[];

    // Verificação de segurança: o email precisa bater
    if (comentarios[comentarioIndex]?.email !== email) {
      return res.status(403).json({ error: "Comentário não pertence ao usuário" });
    }

    const novosComentarios = comentarios.filter((_, i) => i !== comentarioIndex);

    const payload = {
      message: `Remoção de comentário em ${referenciaId}`,
      content: Buffer.from(JSON.stringify(novosComentarios, null, 2)).toString("base64"),
      branch: BRANCH,
      sha: jsonData.sha,
    };

    const put = await fetch(commentUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (!put.ok) {
      const msg = await put.text();
      throw new Error("Erro ao remover comentário: " + msg);
    }

    return res.json({ sucesso: true });
  } catch (err: any) {
    console.error("Erro ao remover comentário:", err);
    return res.status(500).json({ error: "Erro ao remover comentário", details: err?.message });
  }
});