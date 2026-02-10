// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/_navbar.scss';
import logo from '../assets/cfx_logo.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const location = useLocation();
  const { user, logout } = useAuth();

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

  const handleLogout = async () => {
    try {
      await logout();
      handleLinkClick();
    } catch (error) {
      console.error('Logout error:', error);
    }
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

  // Get first name from user
  const firstName = user?.name?.split(' ')[0] || 'User';

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
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/calculator', label: 'Position Calculator' },
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

          {/* User Section */}
          {user ? (
            <>
              {/* Welcome Message - Desktop Only */}
              <li className="list-items user-welcome">
                <span className="navbar__welcome">Hey, {firstName}</span>
              </li>

              {/* Dashboard Button */}
              <li className="list-items auth-btn-item">
                <Link
                  to="/dashboard"
                  className="navbar__auth-btn"
                  onClick={handleLinkClick}
                >
                  Dashboard
                </Link>
              </li>

              {/* Logout - Mobile Only */}
              <li className="list-items logout-mobile">
                <button onClick={handleLogout} className="links logout-link">
                  Logout
                </button>
              </li>
            </>
          ) : (
            /* Sign In / Sign Up Button */
            <li className="list-items auth-btn-item">
              <Link
                to="/auth"
                className="navbar__auth-btn"
                onClick={handleLinkClick}
              >
                Sign In
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Overlay – mobile/tablet only */}
      {menuOpen && (
        <div
          className="navbar__overlay"
          onClick={() => {
            // ❌ Do NOTHING on desktop
            if (window.innerWidth >= 769) return;

            // ✅ Close only on mobile/tablet
            setMenuOpen(false);
            setProductOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
