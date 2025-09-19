// 📁 lib/auth.ts
export function generateRandomState(): string {
  return [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

export async function exchangeCodeForTokenGoogle(code: string, codeVerifier: string) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error_description || "Erro ao obter token do Google");
  }

  return response.json();
}

function generateRandomString(length = 128) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

function base64URLEncode(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

export function redirectToGitHubLogin(state?: string) {
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;

  const generatedState = state || generateRandomState();
  sessionStorage.setItem('oauth_state', generatedState);

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&state=${generatedState}`;
  window.location.assign(githubAuthUrl);
}

export function handleLogout() {
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('oauth_state');
  window.location.assign('/');
}

export async function redirectToGoogleLogin() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  const codeVerifier = generateRandomString();
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));
  localStorage.setItem("code_verifier", codeVerifier);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${googleClientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  window.location.assign(googleAuthUrl);
}
