import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './_landing.scss';
import monitorImg from '../assets/monitor.jpg';

// ── Counter hook ──────────────────────────────────────────
const useCounter = (target, duration = 2000, started = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
};

// ── Intersection observer hook ────────────────────────────
const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

// ── Testimonials data ─────────────────────────────────────
const TESTIMONIALS = [
  {
    text: 'Corepips completely changed my trading. I went from random entries to structured setups with clear rules.',
    name: 'John D.',
    role: 'Retail Forex Trader',
    avatar: 'J',
  },
  {
    text: 'The mentorship and journal helped me fix my psychology. My win rate improved from 32% to over 61%.',
    name: 'Sarah K.',
    role: 'Part-time Trader',
    avatar: 'S',
  },
  {
    text: "Best investment I've made in my trading education. The playbooks alone are worth the price.",
    name: 'Michael O.',
    role: 'Prop Firm Trader',
    avatar: 'M',
  },
  {
    text: 'The position size calculator and risk tools saved my account. I used to blow up monthly — not anymore.',
    name: 'Amara L.',
    role: 'Forex Enthusiast',
    avatar: 'A',
  },
  {
    text: 'The live trade reviews from the mentors gave me feedback I never got anywhere else. Game changer.',
    name: 'Tunde B.',
    role: 'Full-time Trader',
    avatar: 'T',
  },
  {
    text: "I joined as a complete beginner. Three months later I'm consistently profitable. Corepips delivers.",
    name: 'Chioma E.',
    role: 'Beginner Trader',
    avatar: 'C',
  },
];

const Landing = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);

  // Section observers
  const [aboutRef, aboutInView] = useInView(0.15);
  const [statsRef, statsInView] = useInView(0.3);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [howRef, howInView] = useInView(0.2);
  const [testimonialsRef, testimonialsInView] = useInView(0.2);
  const [mentorshipRef, mentorshipInView] = useInView(0.15);
  const [offerRef, offerInView] = useInView(0.2);

  // Counters
  const traders = useCounter(100, 2200, statsInView);
  const winRate = useCounter(85, 1800, statsInView);
  const trades = useCounter(1000, 2400, statsInView);

  // ── Smartsupp live chat ───────────────────────────────────
  useEffect(() => {
    if (document.getElementById('tawkto-script')) return;

    const script = document.createElement('script');
    script.id = 'tawkto-script';
    script.async = true;
    script.src = 'https://embed.tawk.to/6a05c339a078b01c35e270d4/1joj856rq';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document
      .getElementsByTagName('script')[0]
      .parentNode.insertBefore(
        script,
        document.getElementsByTagName('script')[0],
      );

    return () => {
      const s = document.getElementById('tawkto-script');
      if (s) s.remove();
      const box = document.getElementById('tawkto-container');
      if (box) box.remove();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    const telegramTimer = setTimeout(() => setShowTelegram(true), 5000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(telegramTimer);
    };
  }, []);

  // Testimonial auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    autoPlayRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4500);
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying]);

  const goToSlide = (idx) => {
    setActiveSlide(idx);
    setIsAutoPlaying(false);
    clearInterval(autoPlayRef.current);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prevSlide = () =>
    goToSlide((activeSlide - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const nextSlide = () => goToSlide((activeSlide + 1) % TESTIMONIALS.length);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      {/* ── Hero ── */}
      <section className="landing-section hero-section sections">
        <div className="hero-content">
          <h1 className="big-txt">Welcome to Corepips Forex Academy</h1>
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

      {/* ── About ── */}
      <section className="about-section" ref={aboutRef}>
        <div className={`about-grid ${aboutInView ? 'in-view' : ''}`}>
          <div className="about-content fade-left">
            <h2 className="about-title">About Corepips</h2>
            <p>
              At Corepips forex academy, we believe trading success comes not
              from luck, but from knowledge, discipline, and consistent
              practice. Our mission is to make forex education accessible to
              everyone.
            </p>
            <p>
              We offer a structured curriculum spanning from foundational market
              concepts to advanced strategies, risk management, and trading
              psychology.
            </p>
            <p>
              What sets us apart is experience — our instructors are active
              traders who bring real-world insights into every lesson.
            </p>
          </div>
          <div className="about-image fade-right">
            <img src={monitorImg} alt="CorepipsFx Academy Training" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section sections" ref={statsRef}>
        <div className={`stats-grid ${statsInView ? 'in-view' : ''}`}>
          <div className="stat stat-1">
            <div className="stat-icon">🎓</div>
            <span className="upto">Upto</span>
            <h3>
              <span className="count">{traders.toLocaleString()}</span>+
            </h3>
            <p>Traders Mentored</p>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{ width: statsInView ? '85%' : '0%' }}
              />
            </div>
          </div>
          <div className="stat stat-2">
            <div className="stat-icon">📈</div>
            <span className="upto">Upto</span>
            <h3>
              <span className="count">{winRate}</span>%
            </h3>
            <p>Improved Consistency</p>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{ width: statsInView ? '85%' : '0%' }}
              />
            </div>
          </div>
          <div className="stat stat-3">
            <div className="stat-icon">📝</div>
            <span className="upto">Upto</span>
            <h3>
              <span className="count">{trades.toLocaleString()}</span>+
            </h3>
            <p>Trades Logged</p>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{ width: statsInView ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section sections" ref={featuresRef}>
        <div className="con-lg">
          <h2>What We Offer</h2>
          <div className={`features-grid ${featuresInView ? 'in-view' : ''}`}>
            {[
              {
                icon: '📊',
                title: 'Position Size Calculator',
                desc: 'Manage your risk effectively with our simple and accurate position size calculator.',
              },
              {
                icon: '📝',
                title: 'Trade Journal',
                desc: 'Track, analyze, and optimize your trades with a detailed journaling dashboard.',
              },
              {
                icon: '📚',
                title: 'Playbooks',
                desc: 'Access proven trading strategies and structured guides to sharpen your execution.',
              },
              {
                icon: '📈',
                title: 'Custom Indicators',
                desc: 'Get exclusive trading indicators designed to match your strategy.',
              },
              {
                icon: '🧠',
                title: 'Mentorship & Feedback',
                desc: 'Receive personalized trade reviews to improve your decision-making.',
              },
              {
                icon: '📊',
                title: 'Performance Analytics',
                desc: 'Gain deep insights into your trading habits, win rate, and risk management.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="features-card"
                style={{ '--delay': `${i * 0.1}s` }}
              >
                <div className="feature-icon-wrap">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="feature-card-glow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-it-works sections" ref={howRef}>
        <h2>How It Works</h2>
        <div className={`steps ${howInView ? 'in-view' : ''}`}>
          {[
            {
              num: '01',
              title: 'Join',
              desc: 'Create your account and access your personal trading dashboard instantly.',
            },
            {
              num: '02',
              title: 'Learn & Trade',
              desc: 'Use playbooks, tools, and expert mentorship to execute high-quality trades.',
            },
            {
              num: '03',
              title: 'Improve',
              desc: 'Track performance and get feedback to grow consistently with our journal tool.',
            },
          ].map((s, i) => (
            <div key={i} className="step" style={{ '--delay': `${i * 0.2}s` }}>
              <div className="step-number">{s.num}</div>
              <div className="step-connector" />
              <div className="step-content">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials Carousel ── */}
      <section className="testimonials-section sections" ref={testimonialsRef}>
        <h2>What Our Students Say</h2>
        <p className="testimonials-subtitle">
          Real stories from real traders in our community
        </p>

        <div
          className={`carousel-wrapper ${testimonialsInView ? 'in-view' : ''}`}
        >
          <button
            className="carousel-arrow carousel-prev"
            onClick={prevSlide}
            aria-label="Previous"
          >
            &#8249;
          </button>

          <div className="carousel-track">
            {TESTIMONIALS.map((t, i) => {
              const offset = i - activeSlide;
              const isActive = offset === 0;
              const isPrev =
                offset === -1 ||
                (activeSlide === 0 && i === TESTIMONIALS.length - 1);
              const isNext =
                offset === 1 ||
                (activeSlide === TESTIMONIALS.length - 1 && i === 0);

              return (
                <div
                  key={i}
                  className={`testimonial-card ${isActive ? 'active' : ''} ${isPrev ? 'prev' : ''} ${isNext ? 'next' : ''}`}
                >
                  <div className="quote-mark">"</div>
                  <p>{t.text}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{t.avatar}</div>
                    <div>
                      <h4>{t.name}</h4>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="carousel-arrow carousel-next"
            onClick={nextSlide}
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>

        <div className="carousel-dots">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === activeSlide ? 'active' : ''}`}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* ── Mentorship ── */}
      <section className="mentorship-section sections" ref={mentorshipRef}>
        <h2>Our Mentorship Plans</h2>
        <p className="mentorship-intro">
          Whether you're a beginner or an experienced trader, Corepips has a
          plan tailored for you.
        </p>
        <div className="con-lg">
          <div
            className={`mentorship-grid ${mentorshipInView ? 'in-view' : ''}`}
          >
            <div className="mentorship-card fade-from-left">
              <div className="plan-badge-pill">Starter</div>
              <h3>🌱 Starter Plan</h3>
              <p className="plan-price">$59.00</p>
              <p className="duration">1 Month Plan</p>
              <p>
                Designed for beginners to build a strong foundation in forex
                basics, risk management, and chart analysis.
              </p>
              <ul>
                <li>
                  <span className="bullet">✔</span> Forex fundamentals
                </li>
                <li>
                  <span className="bullet">✔</span> Trading psychology
                </li>
                <li>
                  <span className="bullet">✔</span> Weekly Q&amp;A sessions
                </li>
              </ul>
              <Link className="btn btn-outline" to="/auth">
                Choose plan
              </Link>
            </div>

            <div className="mentorship-card fade-from-bottom popular">
              <div className="popular-tag">Most Popular</div>
              <div className="plan-badge-pill">Pro</div>
              <h3>🚀 Pro Plan</h3>
              <p className="plan-price">$125.00</p>
              <p className="duration">3 Months Plan</p>
              <p>
                Perfect for traders who want to refine strategy, manage risk,
                and scale profits.
              </p>
              <ul>
                <li>
                  <span className="bullet">✔</span> Advanced strategies
                </li>
                <li>
                  <span className="bullet">✔</span> Personalized mentorship
                </li>
                <li>
                  <span className="bullet">✔</span> Trade Management Bots
                </li>
                <li>
                  <span className="bullet">✔</span> Trade reviews &amp; feedback
                </li>
              </ul>
              <Link className="btn btn-outline" to="/auth">
                Choose plan
              </Link>
            </div>

            <div className="mentorship-card fade-from-right">
              <div className="plan-badge-pill">Elite</div>
              <h3>👑 Elite Plan</h3>
              <p className="plan-price">$249.00</p>
              <p className="duration">6 Months Plan</p>
              <p>
                For seasoned traders aiming for mastery, consistency, and
                professional-level analysis.
              </p>
              <ul>
                <li>
                  <span className="bullet">✔</span> Everything in pro plan
                </li>
                <li>
                  <span className="bullet">✔</span> 1-on-1 private coaching
                </li>
                <li>
                  <span className="bullet">✔</span> Free playbook
                </li>
                <li>
                  <span className="bullet">✔</span> Lifetime journal access
                </li>
                <li>
                  <span className="bullet">✔</span> Trade Management Bots
                </li>
                <li>
                  <span className="bullet">✔</span> Exclusive community
                </li>
              </ul>
              <Link className="btn btn-outline" to="/auth">
                Choose plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Offer ── */}
      <section className="offer-section" ref={offerRef}>
        <div className={`offer-inner ${offerInView ? 'in-view' : ''}`}>
          <div className="offer-particles">
            {[...Array(12)].map((_, i) => (
              <span key={i} className="particle" style={{ '--i': i }} />
            ))}
          </div>
          <div className="offer-badge">FREE RESOURCE</div>
          <h2>Ready to Start Your Trading Journey?</h2>
          <p>
            Download our free beginner/intermediate guide and start trading
            smarter today.
          </p>
          <Link className="btn btn-offer" to="/auth">
            <span>Download Free</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Scroll-to-top ── */}
      <button
        className={`scroll-top-btn ${showScrollTop ? 'show' : ''}`}
        onClick={scrollToTop}
      >
        <i className="fas fa-arrow-up"></i>
      </button>

      {/* ── Telegram ── */}
      <a
        href="https://t.me/corepipsfxacademy"
        target="_blank"
        rel="noopener noreferrer"
        className={`telegram-btn ${showTelegram ? 'show' : ''}`}
      >
        <i className="fab fa-telegram-plane"></i>
      </a>

      {/* Smartsupp is injected via useEffect — no JSX needed here */}
    </>
  );
};

export default Landing;
