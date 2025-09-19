import { useState } from 'react';
import { redirectToGitHubLogin, redirectToGoogleLogin } from '@/lib/auth';
import Loading from '@/components/Loading';

export default function Login() {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <Loading texto="Redirecionando para autenticação..." />;
  }

  return (
    <section
      data-testid="page-login"
      className="max-w-xl mx-auto p-6 text-body text-center"
      aria-labelledby="login-title"
    >
      <h1 id="login-title" className="text-3xl font-bold mb-6 text-heading">
        Login com sua Conta
      </h1>

      <p className="mb-4 text-base">
        Para participar das <strong>Referências QWay</strong>, você precisa estar autenticado com uma conta válida.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <button
          onClick={() => {
            localStorage.setItem("oauth_provider", "github");
            setLoading(true);
            redirectToGitHubLogin();
          }}
          className="btn-login"
        >
          Entrar com GitHub
        </button>

        <button
          onClick={() => {
            localStorage.setItem("oauth_provider", "google");
            setLoading(true);
            redirectToGoogleLogin();
          }}
          className="btn-login"
        >
          Entrar com Google
        </button>
      </div>
    </section>
  );
}
