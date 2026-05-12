import { useState, useRef, useEffect } from 'react';
import './_learnforex.scss';

// ─── SVG Animations ──────────────────────────────────────────────────────────
const CandleAnimation = () => (
  <svg viewBox="0 0 80 80" width="64" height="64" style={{ display: 'block' }}>
    <style>{`
      @keyframes candleGrow  { 0%{height:0;y:40} 100%{height:28;y:12} }
      @keyframes wickGrow    { 0%{height:0;y:40} 100%{height:8;y:4}  }
      @keyframes candleGrow2 { 0%{height:0;y:40} 100%{height:20;y:20} }
      .lf-c1 { animation: candleGrow  1.2s ease forwards; }
      .lf-w1 { animation: wickGrow    1.2s ease forwards; }
      .lf-c2 { animation: candleGrow2 1.4s 0.2s ease forwards; }
    `}</style>
    <rect
      x="20"
      y="12"
      width="14"
      height="28"
      rx="2"
      fill="#22c55e"
      className="lf-c1"
    />
    <rect x="26" y="4" width="2" height="8" fill="#22c55e" className="lf-w1" />
    <rect
      x="46"
      y="20"
      width="14"
      height="20"
      rx="2"
      fill="#ef4444"
      className="lf-c2"
    />
    <rect x="52" y="14" width="2" height="6" fill="#ef4444" />
  </svg>
);

const ChartAnimation = () => (
  <svg viewBox="0 0 80 60" width="64" height="48" style={{ display: 'block' }}>
    <style>{`
      @keyframes lf-lineIn { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
      .lf-line { stroke-dasharray:200; animation: lf-lineIn 1.5s ease forwards; }
    `}</style>
    <polyline
      points="5,50 20,35 35,40 50,20 65,25 75,10"
      fill="none"
      stroke="#22c55e"
      strokeWidth="2.5"
      className="lf-line"
    />
    <polyline
      points="5,50 20,45 35,48 50,38 65,42 75,36"
      fill="none"
      stroke="#0051cc"
      strokeWidth="1.5"
      strokeDasharray="4 3"
    />
  </svg>
);

// ─── Session Clock Component ──────────────────────────────────────────────────
const SESSIONS = [
  {
    name: 'Sydney',
    flag: '🦘',
    timezone: 'Australia/Sydney',
    openHourUTC: 22, // 10 PM UTC (approx, summer)
    closeHourUTC: 7,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    pairs: 'AUD, NZD',
    watOpen: '11 PM',
    watClose: '8 AM',
  },
  {
    name: 'Tokyo',
    flag: '🗼',
    timezone: 'Asia/Tokyo',
    openHourUTC: 0,
    closeHourUTC: 9,
    color: '#e94560',
    glow: 'rgba(233,69,96,0.3)',
    pairs: 'JPY, AUD',
    watOpen: '1 AM',
    watClose: '10 AM',
  },
  {
    name: 'London',
    flag: '🏰',
    timezone: 'Europe/London',
    openHourUTC: 8,
    closeHourUTC: 17,
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.3)',
    pairs: 'EUR, GBP, CHF',
    watOpen: '9 AM',
    watClose: '6 PM',
  },
  {
    name: 'New York',
    flag: '🗽',
    timezone: 'America/New_York',
    openHourUTC: 13,
    closeHourUTC: 22,
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.3)',
    pairs: 'USD, CAD',
    watOpen: '2 PM',
    watClose: '11 PM',
  },
];

// Overlaps (UTC hour ranges)
const OVERLAPS = [
  {
    name: 'Tokyo–London',
    start: 8,
    end: 9,
    color: '#c084fc',
    sessions: ['Tokyo', 'London'],
    desc: 'Low–moderate volatility. EUR/JPY, GBP/JPY active.',
    watTime: '9–10 AM WAT',
  },
  {
    name: 'London–New York',
    start: 13,
    end: 17,
    color: '#ff6b6b',
    sessions: ['London', 'New York'],
    desc: 'Highest volatility of the day. Best time for all major pairs. Prime time for Nigerian traders.',
    watTime: '2–6 PM WAT ⭐ PRIME',
  },
];

function isSessionOpen(session) {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcTotal = utcH * 60 + utcM;
  const open = session.openHourUTC * 60;
  const close = session.closeHourUTC * 60;
  if (open < close) return utcTotal >= open && utcTotal < close;
  // overnight session (wraps midnight)
  return utcTotal >= open || utcTotal < close;
}

function isOverlapActive(overlap) {
  const now = new Date();
  const utcH = now.getUTCHours();
  return utcH >= overlap.start && utcH < overlap.end;
}

function getLocalTime(timezone) {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function getWATTime() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Analog clock SVG face
function AnalogClock({ timezone, color }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const localStr = time.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const [hStr, mStr, sStr] = localStr.split(':');
  const h = parseInt(hStr, 10) % 12;
  const m = parseInt(mStr, 10);
  const s = parseInt(sStr, 10);

  const sDeg = s * 6;
  const mDeg = m * 6 + s * 0.1;
  const hDeg = h * 30 + m * 0.5;

  const hand = (deg, len, width, clr) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    const x2 = 40 + len * Math.cos(rad);
    const y2 = 40 + len * Math.sin(rad);
    return (
      <line
        x1="40"
        y1="40"
        x2={x2.toFixed(2)}
        y2={y2.toFixed(2)}
        stroke={clr}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  };

  // tick marks
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    const x1 = 40 + 32 * Math.cos(angle);
    const y1 = 40 + 32 * Math.sin(angle);
    const x2 = 40 + 36 * Math.cos(angle);
    const y2 = 40 + 36 * Math.sin(angle);
    return (
      <line
        key={i}
        x1={x1.toFixed(1)}
        y1={y1.toFixed(1)}
        x2={x2.toFixed(1)}
        y2={y2.toFixed(1)}
        stroke={`${color}80`}
        strokeWidth="1.5"
      />
    );
  });

  return (
    <svg viewBox="0 0 80 80" width="80" height="80">
      {/* Face */}
      <circle
        cx="40"
        cy="40"
        r="38"
        fill="#0d1f35"
        stroke={`${color}40`}
        strokeWidth="1.5"
      />
      <circle
        cx="40"
        cy="40"
        r="38"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.4"
      />
      {/* Glow ring */}
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="none"
        stroke={color}
        strokeWidth="6"
        opacity="0.06"
      />
      {/* Ticks */}
      {ticks}
      {/* Hands */}
      {hand(hDeg, 20, 2.5, '#e2e8f0')}
      {hand(mDeg, 27, 1.8, color)}
      {hand(sDeg, 30, 1, '#ff6b6b')}
      {/* Center dot */}
      <circle cx="40" cy="40" r="2.5" fill={color} />
    </svg>
  );
}

// Full session clock widget
function SessionClocks() {
  const [tick, setTick] = useState(0);
  const [watTime, setWatTime] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setWatTime(getWATTime());
    }, 1000);
    setWatTime(getWATTime());
    return () => clearInterval(id);
  }, []);

  return (
    <div className="lf-session-clocks">
      {/* WAT header */}
      <div className="lf-session-clocks__header">
        <span className="lf-session-clocks__wat-label">🇳🇬 Your time (WAT)</span>
        <span className="lf-session-clocks__wat-time">{watTime}</span>
      </div>

      {/* 4 clocks */}
      <div className="lf-clocks-grid">
        {SESSIONS.map((session) => {
          const open = isSessionOpen(session);
          return (
            <div
              key={session.name}
              className={`lf-clock-card ${open ? 'lf-clock-card--open' : ''}`}
              style={{ '--sc': session.color, '--sg': session.glow }}
            >
              <div className="lf-clock-card__status">
                <span
                  className={`lf-clock-card__dot ${open ? 'lf-clock-card__dot--open' : ''}`}
                />
                <span className="lf-clock-card__status-text">
                  {open ? 'OPEN' : 'CLOSED'}
                </span>
              </div>

              <div className="lf-clock-card__face">
                <AnalogClock
                  timezone={session.timezone}
                  color={session.color}
                />
              </div>

              <div className="lf-clock-card__digital">
                {getLocalTime(session.timezone)}
              </div>

              <div className="lf-clock-card__name">
                <span>{session.flag}</span> {session.name}
              </div>

              <div className="lf-clock-card__meta">
                <span>
                  {session.watOpen}–{session.watClose} WAT
                </span>
                <span className="lf-clock-card__pairs">{session.pairs}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlaps */}
      <div className="lf-overlaps">
        <h4 className="lf-overlaps__title">⚡ Session Overlaps</h4>
        <div className="lf-overlaps__grid">
          {OVERLAPS.map((ov) => {
            const active = isOverlapActive(ov);
            return (
              <div
                key={ov.name}
                className={`lf-overlap-card ${active ? 'lf-overlap-card--active' : ''}`}
                style={{ '--oc': ov.color }}
              >
                <div className="lf-overlap-card__top">
                  <span className="lf-overlap-card__name">{ov.name}</span>
                  {active && (
                    <span className="lf-overlap-card__live">● LIVE NOW</span>
                  )}
                </div>
                <div className="lf-overlap-card__time">{ov.watTime}</div>
                <p className="lf-overlap-card__desc">{ov.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Topic Data ───────────────────────────────────────────────────────────────
const TOPICS = [
  {
    id: 'forex-basics',
    title: 'Forex Basics',
    icon: '🌐',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#e94560',
    tag: 'Start Here',
    duration: '5 min read',
    content: {
      intro:
        "Forex (Foreign Exchange) is the world's largest financial market — trading over $7 trillion daily. It's where currencies are bought and sold.",
      sections: [
        {
          heading: 'What is Forex?',
          icon: '💱',
          body: "Forex trading involves exchanging one currency for another. When you travel abroad and convert your Naira to Dollars, you've participated in forex. Traders do this at scale to profit from price differences.",
        },
        {
          heading: 'Why Does Forex Exist?',
          icon: '🏦',
          body: 'Governments, corporations, and banks need to convert currencies to conduct international business. This constant need for exchange creates the market.',
        },
        {
          heading: 'Who Trades Forex?',
          icon: '👥',
          body: "Central banks, commercial banks, hedge funds, corporations, and retail traders (like you) all participate. Retail traders make up about 5% of volume — but that's still billions of dollars daily.",
        },
        {
          heading: 'How Do Traders Make Money?',
          icon: '📈',
          body: "If EUR/USD is at 1.1000 and you buy it, then it rises to 1.1050, you've gained 50 pips. Traders profit from these price movements — going up (buying) or going down (selling).",
        },
      ],
      keyPoints: [
        '24/5 market — trades around the clock on weekdays',
        'Most liquid market in the world',
        'Accessible with small capital via leverage',
        'Profits possible in both rising and falling markets',
      ],
    },
  },
  {
    id: 'currency-pairs',
    title: 'Currency Pairs',
    icon: '🔄',
    gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #1e3a5f 100%)',
    accent: '#00d4ff',
    tag: 'Core Concept',
    duration: '6 min read',
    content: {
      intro:
        "Currencies are always traded in pairs. You're simultaneously buying one currency and selling another. Understanding pairs is the foundation of every trade.",
      sections: [
        {
          heading: 'Base & Quote Currency',
          icon: '⚖️',
          body: "In EUR/USD — EUR is the BASE currency (what you're buying) and USD is the QUOTE currency. If EUR/USD = 1.1000, you need $1.10 to buy €1.",
        },
        {
          heading: 'Major Pairs',
          icon: '🏆',
          body: 'The most traded pairs always include USD: EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD. Tightest spreads and highest liquidity.',
        },
        {
          heading: 'Minor Pairs',
          icon: '📊',
          body: 'Pairs without USD but involving major currencies: EUR/GBP, EUR/JPY, GBP/JPY. Slightly wider spreads but still very tradeable for beginners.',
        },
        {
          heading: 'Exotic Pairs',
          icon: '⚠️',
          body: 'One major + one emerging market currency: USD/NGN, EUR/TRY. Wide spreads, high volatility, less predictable. Avoid as a beginner.',
        },
      ],
      keyPoints: [
        'EUR/USD is the most traded pair in the world',
        "Start with majors — they're most predictable",
        'Check spread cost before choosing a pair',
        'USD/JPY and EUR/USD are most beginner-friendly',
      ],
    },
  },
  {
    id: 'pips-lots',
    title: 'Pips & Lot Sizes',
    icon: '📏',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #0e2241 50%, #1a3a6b 100%)',
    accent: '#f59e0b',
    tag: 'Must Know',
    duration: '7 min read',
    content: {
      intro:
        'A pip is the smallest price movement in forex. Lot size determines how much money moves per pip. Together, they define your profit and loss.',
      sections: [
        {
          heading: 'What is a Pip?',
          icon: '🔬',
          body: "PIP = Percentage In Point. For most pairs it's the 4th decimal place. EUR/USD moving 1.1000 → 1.1001 = 1 pip. JPY pairs use 2nd decimal: 110.00 → 110.01 = 1 pip.",
        },
        {
          heading: 'Lot Sizes',
          icon: '📦',
          body: 'Standard Lot = 100,000 units (~$10/pip) | Mini Lot = 10,000 units (~$1/pip) | Micro Lot = 1,000 units (~$0.10/pip) | Nano Lot = 100 units (~$0.01/pip).',
        },
        {
          heading: 'Why Lot Size Matters',
          icon: '💰',
          body: '1 standard lot on a 50-pip move = $500 profit OR loss. Same move on a micro lot = $5. Beginners MUST start with micro or nano lots.',
        },
        {
          heading: 'Fractional Pips',
          icon: '🔭',
          body: "Most brokers show 5 decimal places. The 5th decimal is a pipette (0.1 pip). EUR/USD at 1.10005 — the '5' is a pipette. It gives more precise pricing.",
        },
      ],
      keyPoints: [
        'Always calculate pip value before entering a trade',
        '1 standard lot = $10 per pip on most major pairs',
        'Start with micro lots while learning',
        'Pipettes are just fractions of pips — not a trick',
      ],
    },
  },
  {
    id: 'leverage-margin',
    title: 'Leverage & Margin',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #4a1515 100%)',
    accent: '#ff6b6b',
    tag: 'High Impact',
    duration: '8 min read',
    content: {
      intro:
        "Leverage lets you control large positions with small capital. It's the most powerful AND most dangerous concept in forex.",
      sections: [
        {
          heading: 'What is Leverage?',
          icon: '⚖️',
          body: 'Leverage of 1:100 means with $100, you control $10,000. A 1% move in your favour = 100% return. A 1% move AGAINST you = 100% loss. It multiplies BOTH.',
        },
        {
          heading: 'What is Margin?',
          icon: '🏦',
          body: 'Margin is the deposit required to open a leveraged position. With 1:100 leverage, to open a $10,000 position you need $100 margin (1%).',
        },
        {
          heading: 'Margin Call',
          icon: '🚨',
          body: 'If your account falls below the required margin level, the broker closes your trades automatically. Always keep free margin as a buffer.',
        },
        {
          heading: 'Safe Leverage for Beginners',
          icon: '🛡️',
          body: 'Professionals rarely use more than 1:10 even when brokers offer 1:500. Recommended: 1:10 to 1:20 maximum when starting out.',
        },
      ],
      keyPoints: [
        'High leverage = high risk, not guaranteed profits',
        'Never use maximum available leverage',
        'Margin call = positions closed automatically',
        'Risk only 1–2% of account per trade',
      ],
    },
  },
  {
    // ── TRADING SESSIONS — extra content injected below via extraContent ──
    id: 'trading-sessions',
    title: 'Trading Sessions',
    icon: '🕐',
    gradient: 'linear-gradient(135deg, #0a1a0a 0%, #0d2b1a 50%, #0f3d20 100%)',
    accent: '#22c55e',
    tag: 'Timing',
    duration: '8 min read',
    hasSessionClocks: true, // ← flag consumed in render
    content: {
      intro:
        'Forex operates 24 hours, 5 days a week across four major sessions. Knowing when to trade is as important as knowing how to trade.',
      sections: [
        {
          heading: 'Sydney Session',
          icon: '🦘',
          body: 'Opens: 10 PM GMT (11 PM WAT) | Closes: 7 AM GMT. Low volatility, low volume. AUD and NZD pairs most active. Wider spreads — not ideal for beginners.',
        },
        {
          heading: 'Tokyo / Asian Session',
          icon: '🗼',
          body: 'Opens: 12 AM GMT (1 AM WAT) | Closes: 9 AM GMT. JPY pairs most active. Moderate volatility. Price often ranges during this session.',
        },
        {
          heading: 'London Session',
          icon: '🏰',
          body: 'Opens: 8 AM GMT (9 AM WAT) | Closes: 5 PM GMT. Highest volume. EUR, GBP, CHF most active. Most breakouts begin here. Best session for Nigerian traders.',
        },
        {
          heading: 'New York Session',
          icon: '🗽',
          body: 'Opens: 1 PM GMT (2 PM WAT) | Closes: 10 PM GMT. Second highest volume. USD pairs very active. The London–NY overlap is the most volatile period of the day.',
        },
      ],
      overlapSections: [
        {
          heading: 'What is a Session Overlap?',
          icon: '🔀',
          body: 'A session overlap occurs when two major markets are open at the same time. During overlaps, trading volume spikes, spreads tighten, and price moves faster and further — creating the best opportunities.',
        },
        {
          heading: 'Tokyo–London Overlap',
          icon: '🟣',
          body: 'Occurs 8–9 AM GMT (9–10 AM WAT). Low-to-moderate volatility. EUR/JPY and GBP/JPY see the most activity. Short window — only 1 hour. Not the prime time but still tradeable.',
        },
        {
          heading: 'London–New York Overlap ⭐',
          icon: '🔴',
          body: 'Occurs 1–5 PM GMT (2–6 PM WAT). The MOST volatile and liquid period of the entire trading week. All major pairs move significantly. This is prime time for Nigerian traders. EUR/USD, GBP/USD, USD/JPY all see heavy volume.',
        },
        {
          heading: 'Why Avoid Non-Overlap Hours?',
          icon: '😴',
          body: 'Outside overlap windows — especially during the Asian session only — price often drifts slowly or ranges tightly. Spreads widen, moves are smaller, and false breakouts are more common. Save your best setups for overlap periods.',
        },
      ],
      keyPoints: [
        'London–NY overlap (2–6 PM WAT) = highest daily volatility',
        'Avoid trading late Sunday / early Monday',
        'London session is the best single session for Nigerian traders',
        'Session overlaps = tighter spreads + bigger moves',
        'Check the economic calendar before any session',
      ],
    },
  },
  {
    id: 'candlestick-basics',
    title: 'Candlestick Basics',
    icon: '🕯️',
    gradient: 'linear-gradient(135deg, #1a1000 0%, #2d1f00 50%, #4a3500 100%)',
    accent: '#fbbf24',
    tag: 'Chart Reading',
    duration: '7 min read',
    content: {
      intro:
        'Candlesticks are the language of price. Every candle tells a story — who was in control (buyers or sellers) during that time period.',
      sections: [
        {
          heading: 'Anatomy of a Candle',
          icon: '🔬',
          body: 'Each candle has 4 parts: OPEN, CLOSE, HIGH, LOW. The body = open to close. The wicks (shadows) = high and low extensions beyond the body.',
        },
        {
          heading: 'Bullish vs Bearish',
          icon: '📊',
          body: 'GREEN (bullish) = close HIGHER than open. RED (bearish) = close LOWER than open. The bigger the body, the stronger the conviction.',
        },
        {
          heading: 'Doji Candle',
          icon: '➖',
          body: 'Open and close nearly equal — tiny or no body. Signals indecision. Often precedes a reversal when appearing after a strong trend.',
        },
        {
          heading: 'Engulfing Candle',
          icon: '🌊',
          body: 'A candle that completely swallows the previous body. Bullish engulfing after a downtrend = reversal signal. Bearish engulfing after uptrend = reversal signal.',
        },
      ],
      keyPoints: [
        'Body size shows strength of movement',
        'Long wicks show price rejection at that level',
        'Always read candles in context of the trend',
        'Start with H1 and H4 timeframes as a beginner',
      ],
    },
  },
  {
    id: 'market-structure',
    title: 'Market Structure',
    icon: '🏗️',
    gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f30 50%, #1a1a4a 100%)',
    accent: '#818cf8',
    tag: 'Price Action',
    duration: '8 min read',
    content: {
      intro:
        'Market structure is how price moves. Understanding it lets you identify trend direction, reversal zones, and where smart money is pushing price.',
      sections: [
        {
          heading: 'Uptrend Structure',
          icon: '📈',
          body: 'Price makes Higher Highs (HH) and Higher Lows (HL). Each peak higher than the last; each pullback above the previous low. Trend is UP.',
        },
        {
          heading: 'Downtrend Structure',
          icon: '📉',
          body: 'Price makes Lower Highs (LH) and Lower Lows (LL). Each low breaks the previous; each bounce fails to reach the previous peak. Trend is DOWN.',
        },
        {
          heading: 'Consolidation / Range',
          icon: '↔️',
          body: 'Price moves sideways between a defined high and low. Neither side winning. Often precedes a big breakout — trade boundaries or wait.',
        },
        {
          heading: 'Why Structure Matters',
          icon: '🧭',
          body: 'Trading with the trend dramatically increases win rate. Most beginners lose because they fight the trend. Identify structure first.',
        },
      ],
      keyPoints: [
        'Always identify structure before entering',
        'Higher timeframe structure overrides lower',
        "Don't fight the trend — trade with it",
        'Structure breaks signal a possible trend change',
      ],
    },
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    icon: '🛡️',
    gradient: 'linear-gradient(135deg, #0a1a15 0%, #0d2d20 50%, #0f4030 100%)',
    accent: '#10b981',
    tag: 'Most Important',
    duration: '10 min read',
    content: {
      intro:
        'Risk management is the reason profitable traders survive long-term. A 40% win rate can still be profitable with good risk management. This is not optional.',
      sections: [
        {
          heading: 'The 1–2% Rule',
          icon: '📐',
          body: 'Never risk more than 1–2% of your account per trade. With $500, max risk is $10 per trade. 10 losses in a row only costs 10–20%. Risking 10% per trade = blown in 10 losses.',
        },
        {
          heading: 'Stop Loss is Non-Negotiable',
          icon: '🛑',
          body: 'A stop loss automatically closes your trade at a preset loss. ALWAYS place one before entering. Set it at a logical level — beyond a swing high/low.',
        },
        {
          heading: 'Risk-to-Reward Ratio',
          icon: '⚖️',
          body: 'Risk $10, aim to make $20 = 1:2 RR. With 1:2 RR you only need to win 4/10 trades to be profitable. Higher RR = less pressure on win rate.',
        },
        {
          heading: 'Emotional Discipline',
          icon: '🧠',
          body: "After a loss, don't double your next lot size to 'recover.' That's revenge trading. Stick to your plan — each trade is independent.",
        },
      ],
      keyPoints: [
        'Risk 1–2% max per trade — always',
        '1:2 risk-to-reward is the minimum target',
        'Never move a stop loss against you',
        "A series of small losses is normal — don't panic",
      ],
    },
  },
  {
    id: 'trading-psychology',
    title: 'Trading Psychology',
    icon: '🧠',
    gradient: 'linear-gradient(135deg, #1a0a1a 0%, #2d1030 50%, #3d1545 100%)',
    accent: '#c084fc',
    tag: 'Mindset',
    duration: '7 min read',
    content: {
      intro:
        '70% of trading success is psychological. A perfect strategy means nothing if fear, greed, and impatience control your decisions.',
      sections: [
        {
          heading: 'Fear & Greed',
          icon: '⚖️',
          body: "FEAR makes you close winning trades too early. GREED makes you hold losers hoping for recovery. Both destroy accounts. They feel like logic — but they're emotions.",
        },
        {
          heading: 'Revenge Trading',
          icon: '🚫',
          body: "After a loss, the urge to immediately re-enter and 'win it back' is revenge trading. It leads to bigger losses and blown accounts. Best move? Step away.",
        },
        {
          heading: 'Overtrading',
          icon: '⏸️',
          body: 'Taking 10 trades a day out of boredom chases action over quality. Professionals wait days for one setup. Overtrading destroys edge via spread costs alone.',
        },
        {
          heading: 'Patience & Process',
          icon: '🕊️',
          body: 'The market will be there tomorrow. Your job is to follow your rules, not to be right. A trader who follows their plan and loses still did their job correctly.',
        },
      ],
      keyPoints: [
        'Losing trades are part of the process — accept them',
        'Journal every trade to track emotional patterns',
        'Take breaks after 2–3 consecutive losses',
        'Focus on process, not profit — results follow discipline',
      ],
    },
  },
  {
    id: 'forex-glossary',
    title: 'Forex Glossary',
    icon: '📖',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #252525 100%)',
    accent: '#94a3b8',
    tag: 'Reference',
    duration: 'Quick Ref',
    content: {
      intro:
        "Your quick-reference guide to the most important forex terms. Bookmark this page — you'll return often.",
      sections: [
        {
          heading: 'A – L',
          icon: '📋',
          body: 'ASK: Price you buy at | BID: Price you sell at | DRAWDOWN: Peak-to-trough loss | ECN: Electronic Communication Network broker | EQUITY: Balance + open P&L | HEDGE: Opposite trade to reduce risk | LIQUIDITY: Ease of buying/selling | LOT: Unit of trade size',
        },
        {
          heading: 'M – P',
          icon: '📋',
          body: 'MARGIN: Deposit to open leveraged position | MARGIN CALL: Forced close when balance too low | PIP: Smallest price movement | POSITION: Open trade | PREMIUM: Extra cost for exotic pairs',
        },
        {
          heading: 'R – S',
          icon: '📋',
          body: 'ROLLOVER: Overnight interest charge/credit | SLIPPAGE: Gap between expected and actual fill | SPREAD: Difference between bid and ask | STOP LOSS: Order to close at max loss | SUPPORT: Level where buying is expected',
        },
        {
          heading: 'T – V',
          icon: '📋',
          body: 'TAKE PROFIT: Target close price | TICK: Minimum price change | TREND: General direction of price | VOLATILITY: Speed and size of price moves | VOLUME: Amount traded in a period',
        },
      ],
      keyPoints: [
        'Spread = your cost every time you trade',
        'Slippage is higher during news events',
        'Volatility creates opportunity — and risk',
        'Always know your margin requirements',
      ],
    },
  },
  {
    id: 'beginner-faq',
    title: 'Beginner FAQ',
    icon: '❓',
    gradient: 'linear-gradient(135deg, #0a1520 0%, #0d2035 50%, #102d4a 100%)',
    accent: '#38bdf8',
    tag: 'FAQ',
    duration: '5 min read',
    content: {
      intro:
        'The most common questions every beginner asks — with honest, no-hype answers.',
      sections: [
        {
          heading: 'Is Forex Trading Risky?',
          icon: '⚠️',
          body: 'Yes — very. Studies show 70–80% of retail traders lose money. The risk is in leverage, poor risk management, and emotional trading. With proper education and discipline, risk can be controlled.',
        },
        {
          heading: 'Can I Trade with ₦10,000 / $10?',
          icon: '💵',
          body: 'Technically yes. But such small capital makes even micro lots feel like gambling. Recommended minimum: $100–$200 to practice real conditions safely.',
        },
        {
          heading: 'How Long Does It Take to Learn?',
          icon: '⏱️',
          body: 'Basics: 1–3 months. Consistent profitability: 1–3 YEARS for most traders. Anyone promising profits in 2 weeks is selling something.',
        },
        {
          heading: 'What Timeframe for Beginners?',
          icon: '📅',
          body: "Start with H4 (4-hour) and D1 (daily) charts. They're less noisy, give more time to think, and show clearer structures. Avoid M1/M5 until you're consistently profitable.",
        },
      ],
      keyPoints: [
        'Demo trade for at least 3 months before going live',
        "Never trade money you can't afford to lose",
        "Avoid signal sellers and 'guaranteed profit' schemes",
        'Forex is a skill — treat it like one',
      ],
    },
  },
];

const CARD_COLORS = [
  { border: '#e94560', glow: 'rgba(233,69,96,0.25)' },
  { border: '#00d4ff', glow: 'rgba(0,212,255,0.25)' },
  { border: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  { border: '#ff6b6b', glow: 'rgba(255,107,107,0.25)' },
  { border: '#22c55e', glow: 'rgba(34,197,94,0.25)' },
  { border: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  { border: '#818cf8', glow: 'rgba(129,140,248,0.25)' },
  { border: '#10b981', glow: 'rgba(16,185,129,0.25)' },
  { border: '#c084fc', glow: 'rgba(192,132,252,0.25)' },
  { border: '#94a3b8', glow: 'rgba(148,163,184,0.2)' },
  { border: '#38bdf8', glow: 'rgba(56,189,248,0.25)' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LearnForex() {
  const [activeTopic, setActiveTopic] = useState(null);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef(null);

  const activeIndex = activeTopic
    ? TOPICS.findIndex((t) => t.id === activeTopic.id)
    : -1;

  const openTopic = (topic) => {
    setAnimating(true);
    setTimeout(() => {
      setActiveTopic(topic);
      setAnimating(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  const closeTopic = () => {
    setAnimating(true);
    setTimeout(() => {
      setActiveTopic(null);
      setAnimating(false);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }, 200);
  };

  const goNext = () => {
    if (activeIndex < TOPICS.length - 1) openTopic(TOPICS[activeIndex + 1]);
  };
  const goPrev = () => {
    if (activeIndex > 0) openTopic(TOPICS[activeIndex - 1]);
  };

  const progress = ((activeIndex + 1) / TOPICS.length) * 100;

  // ── TOPIC CONTENT PAGE ────────────────────────────────────────────────────
  if (activeTopic) {
    const isSessions = activeTopic.id === 'trading-sessions';

    return (
      <div
        className={`lf-page ${animating ? 'lf-page-exit' : 'lf-page-enter'}`}
        ref={contentRef}
      >
        {/* Top bar */}
        <div className="lf-topbar">
          <button className="lf-topbar__back" onClick={closeTopic}>
            ← All Topics
          </button>
          <div className="lf-topbar__spacer" />
          <span className="lf-topbar__counter">
            {activeIndex + 1} / {TOPICS.length}
          </span>
        </div>

        {/* Hero — card gradient retained */}
        <div
          className="lf-topic-hero"
          style={{ background: activeTopic.gradient }}
        >
          <div className="lf-topic-hero__inner">
            <div
              className="lf-topic-hero__badge"
              style={{
                background: `${activeTopic.accent}20`,
                border: `1px solid ${activeTopic.accent}55`,
                color: activeTopic.accent,
              }}
            >
              ● {activeTopic.tag} · {activeTopic.duration}
            </div>
            <div className="lf-topic-hero__heading">
              <span className="lf-topic-hero__emoji">{activeTopic.icon}</span>
              <h1 className="lf-topic-hero__title">{activeTopic.title}</h1>
            </div>
            <p className="lf-topic-hero__intro">{activeTopic.content.intro}</p>
          </div>
        </div>

        {/* Body — CorePips theme */}
        <div className="lf-topic-body">
          {/* ── Session Clocks (trading-sessions only) ── */}
          {isSessions && (
            <div className="lf-section-divider">
              <span>🕐 Live Session Clocks</span>
            </div>
          )}
          {isSessions && <SessionClocks />}

          {/* Main sections */}
          {isSessions && (
            <div className="lf-section-divider">
              <span>📚 The Four Sessions</span>
            </div>
          )}

          <div className="lf-sections-list">
            {activeTopic.content.sections.map((section, i) => (
              <div key={i} className="lf-section-block" style={{ '--si': i }}>
                <span className="lf-section-block__icon">{section.icon}</span>
                <div>
                  <h3 className="lf-section-block__heading">
                    {section.heading}
                  </h3>
                  <p className="lf-section-block__body">{section.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Overlap sections (trading-sessions only) ── */}
          {isSessions && activeTopic.content.overlapSections && (
            <>
              <div className="lf-section-divider lf-section-divider--overlap">
                <span>⚡ Session Overlaps Explained</span>
              </div>
              <div className="lf-sections-list">
                {activeTopic.content.overlapSections.map((section, i) => (
                  <div
                    key={i}
                    className="lf-section-block lf-section-block--overlap"
                    style={{ '--si': i }}
                  >
                    <span className="lf-section-block__icon">
                      {section.icon}
                    </span>
                    <div>
                      <h3 className="lf-section-block__heading">
                        {section.heading}
                      </h3>
                      <p className="lf-section-block__body">{section.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Key Takeaways */}
          <div className="lf-takeaways">
            <p className="lf-takeaways__label">Key Takeaways</p>
            <div className="lf-takeaways__list">
              {activeTopic.content.keyPoints.map((point, i) => (
                <div key={i} className="lf-takeaway-item" style={{ '--ki': i }}>
                  <span className="lf-takeaway-item__num">{i + 1}</span>
                  <span className="lf-takeaway-item__text">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer nav */}
          <div className="lf-topic-footer">
            <div className="lf-progress">
              <div className="lf-progress__labels">
                <span>Progress</span>
                <span>
                  {activeIndex + 1}/{TOPICS.length} topics
                </span>
              </div>
              <div className="lf-progress__track">
                <div
                  className="lf-progress__fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="lf-topic-nav">
              <button
                className="lf-nav-btn lf-nav-btn--prev"
                onClick={goPrev}
                disabled={activeIndex === 0}
              >
                <p className="lf-nav-btn__label">← PREVIOUS</p>
                <p className="lf-nav-btn__name">
                  {activeIndex > 0 ? TOPICS[activeIndex - 1].title : '—'}
                </p>
              </button>

              <button
                className="lf-nav-btn lf-nav-btn--grid"
                onClick={closeTopic}
                title="All Topics"
              >
                ⊞
              </button>

              <button
                className="lf-nav-btn lf-nav-btn--next"
                onClick={goNext}
                disabled={activeIndex === TOPICS.length - 1}
              >
                <p className="lf-nav-btn__label">NEXT →</p>
                <p className="lf-nav-btn__name">
                  {activeIndex < TOPICS.length - 1
                    ? TOPICS[activeIndex + 1].title
                    : '—'}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GRID / HOME PAGE ────────────────────────────────────────────────────────
  return (
    <div className={`lf-page ${animating ? 'lf-page-exit' : 'lf-page-enter'}`}>
      <section className="lf-hero">
        <div className="lf-hero__inner">
          <div className="lf-hero__anims">
            <CandleAnimation />
            <ChartAnimation />
            <CandleAnimation />
          </div>

          <div className="lf-hero__badge">
            Free Education · {TOPICS.length} Topics
          </div>

          <h1 className="lf-hero__title">
            Learn Forex For Free With
            <span className="lf-hero__title-gradient">Corepips Academy</span>
          </h1>

          <p className="lf-hero__sub">
            No fluff. No hype. Clear, beginner-friendly lessons built for
            traders who are serious about learning the right way.
          </p>

          <div className="lf-hero__stats">
            {[
              { val: TOPICS.length, label: 'Topics' },
              { val: '100%', label: 'Free' },
              { val: '~1 hr', label: 'Total Read' },
            ].map((s, i) => (
              <div key={i} className="lf-hero__stat">
                <strong>{s.val}</strong>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap strip */}
      <div className="lf-roadmap">
        <div className="lf-roadmap__inner">
          {TOPICS.map((t, i) => (
            <div
              key={t.id}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <button
                className="lf-roadmap__btn"
                onClick={() => openTopic(t)}
                style={{
                  borderColor: `${CARD_COLORS[i % CARD_COLORS.length].border}60`,
                }}
              >
                {t.icon} {t.title}
              </button>
              {i < TOPICS.length - 1 && (
                <span className="lf-roadmap__sep">|</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="lf-grid-wrap">
        <div className="lf-grid">
          {TOPICS.map((topic, i) => {
            const color = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <div
                key={topic.id}
                className="lf-card"
                onClick={() => openTopic(topic)}
                style={{
                  '--i': i,
                  background: topic.gradient,
                  border: `1px solid ${color.border}35`,
                  boxShadow: `0 4px 28px ${color.glow}`,
                }}
              >
                <div className="lf-card__top">
                  <span className="lf-card__icon">{topic.icon}</span>
                  <span
                    className="lf-card__tag"
                    style={{
                      background: `${color.border}20`,
                      border: `1px solid ${color.border}45`,
                      color: color.border,
                    }}
                  >
                    {topic.tag}
                  </span>
                </div>
                <h3 className="lf-card__title">{topic.title}</h3>
                <p className="lf-card__intro">{topic.content.intro}</p>
                <div
                  className="lf-card__footer"
                  style={{ borderTop: `1px solid ${color.border}22` }}
                >
                  <span
                    className="lf-card__duration"
                    style={{ color: color.border }}
                  >
                    {topic.duration}
                  </span>
                  <span
                    className="lf-card__arrow"
                    style={{
                      background: `${color.border}20`,
                      border: `1px solid ${color.border}50`,
                      color: color.border,
                    }}
                  >
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lf-cta">
          <p className="lf-cta__emoji">🚀</p>
          <h3 className="lf-cta__title">Ready to start learning?</h3>
          <p className="lf-cta__sub">
            Start from Forex Basics and work your way through — each topic
            builds on the last.
          </p>
          <button className="lf-cta__btn" onClick={() => openTopic(TOPICS[0])}>
            Start with Forex Basics →
          </button>
        </div>
      </div>
    </div>
  );
}
