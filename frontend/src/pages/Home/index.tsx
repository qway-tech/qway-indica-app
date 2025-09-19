import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">QWay Referências</h1>
        <p className="text-lg text-muted">
          Esta versão do projeto está focada exclusivamente nas referências da comunidade.
        </p>
        <div className="mt-6">
          <Link to="/referencias" className="btn-action">
            Ver Referências
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
