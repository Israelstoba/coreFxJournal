import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './_landing.scss';
import monitorImg from '../assets/monitor.jpg';

const Landing = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);

    const telegramTimer = setTimeout(() => {
      setShowTelegram(true);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(telegramTimer);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="landing-section hero sections">
        <div className="hero-content">
          <h1 className="big-txt">Master Forex Trading with CoreFx Academy</h1>
          <p className="small-txt">
            Transform your trading skills with expert-led courses, proven
            strategies, and comprehensive market analysis from industry
            professionals.
          </p>

          <div className="hero-buttons">
            <Link className="btn btn-prim" to="/auth">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-content">
            <h2 className="about-title">About CoreFx</h2>
            <p>
              At CoreFx Academy, we believe trading success comes not from luck,
              but from knowledge, discipline, and consistent practice. Our
              mission is to make forex education accessible to everyone,
              empowering traders at all levels with the skills and tools they
              need to thrive.
            </p>
            <p>
              We offer a structured curriculum that spans from foundational
              market concepts to advanced strategies, risk management, and
              trading psychology.
            </p>
            <p>
              What sets us apart is experience — our instructors are active
              traders who bring real-world insights into every lesson, ensuring
              you gain practical strategies that work in today's markets.
            </p>

            <div className="about-icons">
              <div className="about-icon">
                <i className="fas fa-chalkboard-teacher"></i>
                <span>Expert-Led Training</span>
              </div>
              <div className="about-icon">
                <i className="fas fa-book-open"></i>
                <span>Structured Curriculum</span>
              </div>
              <div className="about-icon">
                <i className="fas fa-chart-line"></i>
                <span>Practical Strategies</span>
              </div>
            </div>
          </div>

          <div className="about-image">
            <img src={monitorImg} alt="CoreFx Academy Training" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="con-lg">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📊 Position Size Calculator</h3>
              <p>
                Manage your risk effectively with our simple and accurate
                position size calculator.
              </p>
            </div>
            <div className="feature-card">
              <h3>📝 Trade Journal</h3>
              <p>
                Track, analyze, and optimize your trades with a detailed
                journaling dashboard.
              </p>
            </div>
            <div className="feature-card">
              <h3>📚 Playbooks</h3>
              <p>
                Access proven trading strategies and structured guides to
                sharpen your execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mentorship Section */}
      <section className="mentorship-section">
        <h2>Our Mentorship Plans</h2>
        <p className="mentorship-intro">
          Whether you're a beginner taking your first steps in forex trading or
          an experienced trader seeking consistency, CoreFx has a mentorship
          plan tailored for you.
        </p>
        <div className="con-lg">
          <div className="mentorship-grid">
            {/* Starter Plan */}
            <div className="mentorship-card">
              <h3>🌱 Starter Plan</h3>
              <p className="plan-price">$59.00</p>
              <p className="duration">1 Month Plan</p>
              <p>
                Designed for beginners to build a strong foundation in forex
                basics, risk management, and chart analysis.
              </p>
              <ul>
                <li>
                  <span className="bullet"> ✔ </span> Forex fundamentals
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Trading psychology
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Weekly Q&A sessions
                </li>
              </ul>
              <Link className="btn btn-prim" to="/auth">
                Enroll Now
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="mentorship-card">
              <h3>🚀 Pro Plan</h3>
              <p className="plan-price">
                $125.00 <span>(Popular)</span>
              </p>
              <p className="duration">3 Months Plan</p>
              <p>
                Perfect for traders who want to refine their strategy, manage
                risk effectively, and scale up their profits.
              </p>
              <ul>
                <li>
                  <span className="bullet"> ✔ </span> Advanced strategies
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Personalized mentorship
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Trade Management Bots
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Trade reviews & feedback
                </li>
              </ul>
              <Link className="btn btn-prim" to="/auth">
                Enroll Now
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="mentorship-card">
              <h3>👑 Elite Plan</h3>
              <p className="plan-price">$249.00</p>
              <p className="duration">6 Months Plan</p>
              <p>
                For seasoned traders aiming for mastery, consistency, and
                professional-level market analysis.
              </p>
              <ul>
                <li>
                  <span className="bullet"> ✔ </span> Everything in pro plan
                </li>
                <li>
                  <span className="bullet"> ✔ </span> 1-on-1 private coaching
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Free playbook
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Lifetime journal access
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Trade Management Bots
                </li>
                <li>
                  <span className="bullet"> ✔ </span> Exclusive community
                </li>
              </ul>
              <Link className="btn btn-prim" to="/auth">
                Enroll Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Start Your Trading Journey?</h2>
        <p>
          Join our community of awesome traders and take the first step towards
          financial independence.
        </p>
        <Link className="btn btn-sec" to="/auth">
          Join Now
        </Link>
      </section>

      {/* Scroll-to-top button */}
      <button
        className={`scroll-top-btn ${showScrollTop ? 'show' : ''}`}
        onClick={scrollToTop}
      >
        <i className="fas fa-arrow-up"></i>
      </button>

      {/* Telegram Floating Button */}
      <a
        href="https://t.me/corefxtradingacademy"
        target="_blank"
        rel="noopener noreferrer"
        className={`telegram-btn ${showTelegram ? 'show' : ''}`}
      >
        <i className="fab fa-telegram-plane"></i>
      </a>
    </>
  );
};

export default Landing;
