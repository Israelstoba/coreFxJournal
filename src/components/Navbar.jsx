import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/_navbar.scss';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setMenuOpen(false); // collapse mobile menu after clicking a link
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo" onClick={handleLinkClick}>
        <img className="navbar__brand" src={logo} alt="Logo" />
      </Link>

      {/* Hamburger for mobile */}
      <button
        className={`navbar__toggle ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Nav Links */}
      <ul className={`navbar__list ${menuOpen ? 'active' : ''}`}>
        <li className="list-items">
          <a className="links" href="/" onClick={handleLinkClick}>
            Home
          </a>
        </li>

        {/* Products with dropdown */}
        <li className="list-items products">
          <span className="links products__btn">Products ▾</span>

          <div className="navbar__dropdown">
            <Link
              to="/calculator"
              className="navbar__dropdown-item"
              onClick={handleLinkClick}
            >
              Position Calculator
            </Link>
            <Link
              to="/journal"
              className="navbar__dropdown-item"
              onClick={handleLinkClick}
            >
              Trade Journal
            </Link>
            <Link
              to="/playbooks"
              className="navbar__dropdown-item"
              onClick={handleLinkClick}
            >
              Playbooks
            </Link>
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
  );
};

export default Navbar;
