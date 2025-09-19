import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login, loading, setLoading } = useAuth();
  const alreadyCalledRef = useRef(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (!code || alreadyCalledRef.current) return;
    alreadyCalledRef.current = true;

    const codeVerifier = localStorage.getItem("code_verifier");
    if (!codeVerifier) return;

    setLoading(true);

    const provider = localStorage.getItem("oauth_provider") || "google";
    fetch(`${apiBaseUrl}/auth/${provider}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.user) {
          console.error("Erro ao obter dados do backend:", data);
          setLoading(false);
          setFinished(true);
          return;
        }

        login(data.access_token, data.user);
        window.history.replaceState({}, "", "/");
        setFinished(true);
        navigate("/");
      })
      .catch((err) => {
        console.error("Erro na requisição ao backend:", err);
        setLoading(false);
        setFinished(true);
      });
  }, [login, navigate, setLoading]);

  if (loading) {
    return (
      <main data-testid="page-auth-callback" className="pt-24 px-6">
        <div className="max-w-xl mx-auto p-6 text-body text-center">
          <h1 className="text-3xl font-bold mb-6 text-heading">Finalizando login…</h1>
          <p className="text-base mb-4">Aguarde, finalizando login...</p>
        </div>
      </main>
    );
  }

  if (!finished) {
    return null;
  }

  return null;
}
