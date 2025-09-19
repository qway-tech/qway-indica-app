import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToHashElement() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Aguarda o DOM renderizar antes de tentar scroll
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      }
    }
  }, [hash]);

  return null;
}