import { Link } from 'react-router-dom';
import '../styles/_footer.scss';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Brand */}
        <div className="footer__brand">
          <h2>CoreFx Academy</h2>
          <p>
            Empowering traders worldwide with education, discipline, and
            real-world strategies for lasting success.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer__links">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/calculator">Position Calculator</Link>
            </li>
            <li>
              <Link to="/dashboard">Trade Journal</Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__contact">
          <h3>Contact Us</h3>
          <p>Email: support@corefx.com</p>
          <p>Phone: +234 703 446 6678</p>
          <div className="footer__socials">
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>
          © {new Date().getFullYear()} CoreFx Trading Academy. All Rights
          Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
