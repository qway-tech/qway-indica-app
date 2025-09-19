// src/components/Footer.tsx
import { FaGlobe, FaYoutube, FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="pt-10 pb-6 px-6 text-center space-y-6" style={{ marginTop: '0' }}>
      <div className="border-t border-grey-3 my-4" />
      <h2 className="text-2xl font-bold text-heading">Acompanhe a QWay</h2>
      <p className="text-body">
        Quer saber mais sobre a QWay? Acompanhe nossos conteúdos e participe da nossa comunidade!
      </p>

      <div className="flex justify-center flex-wrap gap-4 mt-4">
        <a
          href="https://qway.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 btn-action-inverted"
        >
          <FaGlobe className="text-xl" />
          Site Oficial
        </a>

        <a
          href="https://www.youtube.com/@qwaytech"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 btn-action-inverted"
        >
          <FaYoutube className="text-xl text-red-600" />
          Canal no YouTube
        </a>

        <a
          href="https://www.instagram.com/qway.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 btn-action-inverted"
        >
          <FaInstagram className="text-xl text-pink-500" />
          Instagram
        </a>

        <a
          href="https://www.linkedin.com/company/qway-tech/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 btn-action-inverted"
        >
          <FaLinkedin className="text-xl text-blue-600" />
          LinkedIn
        </a>
      </div>
      <hr className="my-6 border-t border-grey-1" />
      <p className="text-sm text-body">
        © {new Date().getFullYear()} QWay Academy. Todos os direitos reservados. Desenvolvido com ♥ pela comunidade QWay.
      </p>
    </footer>
  );
}