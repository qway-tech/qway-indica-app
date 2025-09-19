import { Suspense } from 'react';
import './App.css';
import Loading from "@/components/Loading";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

// Páginas (todas com index.tsx)
import Home from '@/pages/Home';
import Indicar from "@/pages/Indicar";
import Referencias from "@/pages/Referencias";
import Login from '@/pages/Login';
import AuthCallback from '@/pages/Login/AuthCallback';

import { useAuth } from "@/context/useAuth";

export default function App() {
  const { loading } = useAuth();

  return (
    <BrowserRouter>
      <Navbar />
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loading />
        </div>
      )}
      <Suspense fallback={<div />}>
        <div className="max-w-7xl mx-auto px-[5%] pb-0">
          <Routes>
            {/* Páginas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/indicar" element={<Indicar />} />
            <Route path="/referencias" element={<Referencias />} />

            {/* Login */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login/callback" element={<AuthCallback />} />

            {/* Redirecionamentos e 404 */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<div className="pt-6">Página não encontrada.</div>} />
          </Routes>
        </div>
      </Suspense>
      <Footer />
    </BrowserRouter>
  );
}
