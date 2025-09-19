// src/context/authUtils.ts

// Tipo canônico de usuário de autenticação usado em todo o frontend
export type AuthUser = {
  name: string;
  email?: string;       // opcional — alguns provedores não retornam email
  login?: string;       // opcional — handle do GitHub
  avatarUrl?: string;   // opcional — URL do avatar
};

export function persistLogin(token: string, user: AuthUser) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function persistLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function loadAuthState(): { token: string | null; user: AuthUser | null } {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
  return { token, user };
}