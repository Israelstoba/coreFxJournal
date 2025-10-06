// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/_navbar.scss';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false); // mobile drawer
  const [productOpen, setProductOpen] = useState(false); // mobile products dropdown
  const menuRef = useRef(null);

  // Close on Escape key
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

  // Click outside to close menu & dropdown
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setProductOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Close product dropdown if menu closes
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

  return (
    <>
      <nav className="navbar" role="navigation">
        <Link to="/" className="navbar__logo" onClick={handleLinkClick}>
          <img src={logo} alt="CoreFx" className="navbar__brand" />
        </Link>

        {/* Hamburger */}
        <button
          className={`navbar__toggle ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
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
                { to: '/journal', label: 'Trade Journal' },
                { to: '/playbooks', label: 'Playbooks' },
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
        </ul>
      </nav>

      {/* Overlay (click closes menu) */}
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
