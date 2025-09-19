import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import ProfileMenu from './ProfileMenu';
import logo from '@/assets/logo.png';

export default function Navbar() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

  const toggleMobileMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const menu = mobileMenuRef.current;
      const toggle = toggleButtonRef.current;
      if (
        menu &&
        toggle &&
        !menu.contains(event.target as Node) &&
        !toggle.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 64); // 64px é a altura atual da navbar
    }

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const navbarHeight = navbar.getBoundingClientRect().height;
      document.body.style.paddingTop = `${navbarHeight}px`;
    }
  }, []);

  return (
    <>
      <nav
        data-testid="navbar"
        className={`navbar fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'h-16' : 'h-32'
          }`}
      >
        <div className="w-full px-[5%] h-full flex items-center justify-between">
          {/* Logo */}
          <div>
            <Link to="/">
              <img
                src={logo}
                alt="QWay Academy"
                className={`object-contain transition-all duration-300 ${isScrolled ? 'h-16' : 'h-32'
                  }`}
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <ul className="flex gap-6">
              <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
                <Link to="/" className="navbar-link hover:font-bold">Home</Link>
              </li>
              <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
                <Link to="/indicar" className="navbar-link hover:font-bold">Indicar</Link>
              </li>
              <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
                <Link to="/referencias" className="navbar-link hover:font-bold">Referências</Link>
              </li>
              {!user ? (
                <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
                  <Link to="/login" className="navbar-link hover:font-bold" data-testid="navbar-login-link">
                    Entrar
                  </Link>
                </li>
              ) : (
                <span data-testid="navbar-profile-button">
                  <ProfileMenu />
                </span>
              )}
            </ul>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            ref={toggleButtonRef}
            onClick={toggleMobileMenu}
            data-testid="navbar-toggle"
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-mobile-menu"
            className={`md:hidden navbar-toggle ${isMobileMenuOpen
                ? 'bg-navbar-toggle-active text-navbar'
                : 'bg-navbar-toggle text-navbar-toggle-active'
              }`}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          data-testid="navbar-mobile-menu"
          id="navbar-mobile-menu"
          className="fixed top-0 left-0 w-full h-screen overflow-y-auto z-[9999] bg-navbar-overlay text-navbar px-[5%] py-4 pt-32"
        >
          <button
            ref={toggleButtonRef}
            onClick={toggleMobileMenu}
            data-testid="navbar-toggle"
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-mobile-menu"
            className={`absolute top-4 right-4 md:hidden navbar-toggle ${isMobileMenuOpen
                ? 'bg-navbar-toggle-active text-navbar'
                : 'bg-navbar-toggle text-navbar-toggle-active'
              }`}
          >
            ✕
          </button>
          <ul className="flex flex-col gap-4 items-end">
            <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
              <Link to="/" className="navbar-link block hover:font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
              <Link
                to="/indicar"
                className="navbar-link block hover:font-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Indicar
              </Link>
            </li>
            <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
              <Link
                to="/referencias"
                className="navbar-link block hover:font-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Referências
              </Link>
            </li>
            {!user ? (
              <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
                <Link
                  to="/login"
                  className="navbar-link block hover:font-bold"
                  data-testid="navbar-login-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
              </li>
            ) : (
              <li className="relative pb-1 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 after:origin-left">
                <ProfileMenu
                  data-testid="navbar-profile-button"
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
