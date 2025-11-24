// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/_navbar.scss';
import logo from '../assets/cfx_logo.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const location = useLocation();

  // Close menu on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProductOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close menu if clicked outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current || !toggleRef.current) return;
      const clickedInsideMenu = menuRef.current.contains(e.target);
      const clickedToggle = toggleRef.current.contains(e.target);
      if (!clickedInsideMenu && !clickedToggle) {
        setMenuOpen(false);
        setProductOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!menuOpen) setProductOpen(false);
  }, [menuOpen]);

  const handleProductToggle = (e) => {
    e.preventDefault();
    setProductOpen((prev) => !prev);
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
    setProductOpen(false);
  };

  // Detect scroll for sticky effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide About & Contact only on /calculator route
  const hideExtraLinks = location.pathname === '/calculator';

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation">
        <Link to="/" className="navbar__logo" onClick={handleLinkClick}>
          <img src={logo} alt="CoreFx" className="navbar__brand" />
        </Link>

        {/* Hamburger */}
        <button
          ref={toggleRef}
          className={`navbar__toggle ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((v) => !v);
            setProductOpen(false);
          }}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Drawer / nav list */}
        <ul
          ref={menuRef}
          className={`navbar__list ${menuOpen ? 'active' : ''}`}
          aria-hidden={!menuOpen}
        >
          <li className="list-items">
            <Link to="/" className="links" onClick={handleLinkClick}>
              Home
            </Link>
          </li>

          {/* Products dropdown */}
          <li className={`list-items products ${productOpen ? 'open' : ''}`}>
            <button
              className="links product-btn"
              onClick={handleProductToggle}
              aria-expanded={productOpen}
              aria-controls="products-dropdown"
            >
              Products ▾
            </button>

            <div
              id="products-dropdown"
              className={`navbar__dropdown ${productOpen ? 'open' : ''}`}
              role="menu"
            >
              {[
                { to: '/calculator', label: 'Position Calculator' },
                { to: '/dashboard', label: 'Trade Journal' },
                { to: '/cfx-flip', label: 'CoreFx Flip' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="navbar__dropdown-item"
                  onClick={handleLinkClick}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </li>

          {!hideExtraLinks && (
            <>
              <li className="list-items">
                <a className="links" href="#about" onClick={handleLinkClick}>
                  About
                </a>
              </li>
              <li className="list-items">
                <a className="links" href="#contact" onClick={handleLinkClick}>
                  Contact
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="navbar__overlay"
          onClick={() => {
            setMenuOpen(false);
            setProductOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
