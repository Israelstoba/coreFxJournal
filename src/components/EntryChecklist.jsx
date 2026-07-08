import React, { useState, useEffect, useRef, useMemo } from 'react';
import './_entrychecklist.scss';

// ─────────────────────────────────────────────
// Defaults & constants
// ─────────────────────────────────────────────
const DEFAULTS = {
  timezone: {
    iana: 'Africa/Lagos',
    label: 'Nigerian Time (WAT)',
    offsetDisplay: 'UTC+1',
  },
  killZones: [
    { name: 'Asian Kill Zone', start: '01:00', end: '04:00' },
    { name: 'London Kill Zone', start: '07:00', end: '11:00' },
    { name: 'New York Kill Zone', start: '13:00', end: '16:00' },
  ],
  checklist: [
    { label: 'Daily Bias', status: 'pending' },
    { label: 'Stop Hunt', status: 'pending' },
    { label: 'Displacement', status: 'pending' },
    { label: 'AOI / ADR Check', status: 'pending' },
  ],
};

const COMMON_TZ = [
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Africa/Accra',
  'Africa/Abidjan',
  'Africa/Khartoum',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Zurich',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'UTC',
];

const DEFAULT_QUOTES = [
  {
    line1: 'A <span>restricted.</span>',
    line2: 'trader is a <span>profitable.</span> trader',
  },
  {
    line1: 'Patience is a <span>strategy,</span>',
    line2: 'wait for the <span>right</span> setup.',
  },
  {
    line1: 'Risk <span>less</span>,earn <span>more,</span>',
    line2: '<span>protect</span> your capital.',
  },
  {
    line1: 'The trend is your <span>friend.</span>',
    line2: 'until it <span>bends.</span>',
  },
  {
    line1: 'No FOMO, only <span>discipline.</span> ',
    line2: 'trades with <span>caution</span>, not <span>emotions.</span>',
  },
  {
    line1: 'Smart money <span>moves.</span>',
    line2: 'follow the <span>institutions.</span>',
  },
];

const STATUS_CYCLE = ['pending', 'confirmed', 'failed'];
const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ─────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────
function hashQuotes(arr) {
  const str = JSON.stringify(arr);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}
const DEFAULTS_HASH = hashQuotes(DEFAULT_QUOTES);

function loadWallpaperState() {
  try {
    const raw = localStorage.getItem('corepips_wallpaper');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function loadQuotesState() {
  try {
    const raw = localStorage.getItem('corepips_quotes');
    const savedHash = localStorage.getItem('corepips_defaults_hash');
    if (raw) {
      let saved = JSON.parse(raw);
      if (savedHash !== DEFAULTS_HASH) {
        const customQuotes = saved.filter((q) => q.custom === true);
        const freshDefaults = DEFAULT_QUOTES.map((q) => ({
          ...q,
          custom: false,
        }));
        saved = [...freshDefaults, ...customQuotes];
        localStorage.setItem('corepips_quotes', JSON.stringify(saved));
        localStorage.setItem('corepips_defaults_hash', DEFAULTS_HASH);
      }
      return saved;
    }
  } catch (_) {}
  localStorage.setItem('corepips_defaults_hash', DEFAULTS_HASH);
  return DEFAULT_QUOTES.map((q) => ({ ...q, custom: false }));
}

function toMins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function tokenize(str) {
  return str.trim().split(/\s+/);
}

function buildLine(tokens, highlighted) {
  return tokens
    .map((word, i) => (highlighted.includes(i) ? `<span>${word}</span>` : word))
    .join(' ');
}

function parseLine(line) {
  const tokens = [];
  const highlighted = [];
  const regex = /<span>(.*?)<\/span>|(\S+)/g;
  let match;
  let i = 0;
  while ((match = regex.exec(line)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(match[1]);
      highlighted.push(i);
    } else {
      tokens.push(match[2]);
    }
    i++;
  }
  return { tokens, highlighted };
}

function getHandCoords(deg, cx, cy, r1, r2) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x1: (cx + r1 * Math.cos(rad)).toFixed(2),
    y1: (cy + r1 * Math.sin(rad)).toFixed(2),
    x2: (cx + r2 * Math.cos(rad)).toFixed(2),
    y2: (cy + r2 * Math.sin(rad)).toFixed(2),
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const EntryChecklist = () => {
  const [timezone, setTimezone] = useState(() => loadWallpaperState().timezone);
  const [killZones, setKillZones] = useState(
    () => loadWallpaperState().killZones,
  );
  const [checklist, setChecklist] = useState(
    () => loadWallpaperState().checklist,
  );
  const [quotes, setQuotes] = useState(() => loadQuotesState());

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [showDefaultOnly, setShowDefaultOnly] = useState(false);

  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [tzPanelOpen, setTzPanelOpen] = useState(false);
  const [tzForm, setTzForm] = useState({
    iana: timezone.iana,
    label: timezone.label,
    offsetDisplay: timezone.offsetDisplay,
  });

  const [openKZEdit, setOpenKZEdit] = useState([]);
  const [kzEditForm, setKzEditForm] = useState({});

  const [clInput, setClInput] = useState('');

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalEditIndex, setModalEditIndex] = useState(-1);
  const [modalLine1, setModalLine1] = useState('');
  const [modalLine2, setModalLine2] = useState('');
  const [modalHighlights, setModalHighlights] = useState({ l1: [], l2: [] });

  const [now, setNow] = useState(new Date());
  const carouselTimerRef = useRef(null);

  // Persist wallpaper state
  useEffect(() => {
    try {
      localStorage.setItem(
        'corepips_wallpaper',
        JSON.stringify({ timezone, killZones, checklist }),
      );
    } catch (_) {}
  }, [timezone, killZones, checklist]);

  // Persist quotes
  useEffect(() => {
    try {
      localStorage.setItem('corepips_quotes', JSON.stringify(quotes));
      localStorage.setItem('corepips_defaults_hash', DEFAULTS_HASH);
    } catch (_) {}
  }, [quotes]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeQuotes = useMemo(() => {
    if (showCustomOnly) return quotes.filter((q) => q.custom === true);
    if (showDefaultOnly) return quotes.filter((q) => q.custom !== true);
    return quotes;
  }, [quotes, showCustomOnly, showDefaultOnly]);

  const safeQuoteIndex = activeQuotes.length
    ? quoteIndex % activeQuotes.length
    : 0;

  const nextQuote = () => {
    setQuoteIndex((prev) =>
      activeQuotes.length ? (prev + 1) % activeQuotes.length : 0,
    );
  };
  const prevQuote = () => {
    setQuoteIndex((prev) =>
      activeQuotes.length
        ? (prev - 1 + activeQuotes.length) % activeQuotes.length
        : 0,
    );
  };
  const goToQuote = (i) => setQuoteIndex(i);

  // Carousel autoplay
  useEffect(() => {
    clearInterval(carouselTimerRef.current);
    if (!carouselPaused) {
      carouselTimerRef.current = setInterval(nextQuote, 6000);
    }
    return () => clearInterval(carouselTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselPaused, activeQuotes.length]);

  const localNow = useMemo(
    () => new Date(now.toLocaleString('en-US', { timeZone: timezone.iana })),
    [now, timezone.iana],
  );

  const isActive = (kz) => {
    const cur = localNow.getHours() * 60 + localNow.getMinutes();
    const s = toMins(kz.start);
    const e = toMins(kz.end);
    if (s <= e) return cur >= s && cur < e;
    return cur >= s || cur < e;
  };

  // ── Kill Zones ──
  const toggleKZEdit = (i) => {
    setOpenKZEdit((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
    setKzEditForm((prev) => ({
      ...prev,
      [i]: prev[i] || {
        name: killZones[i].name,
        start: killZones[i].start,
        end: killZones[i].end,
      },
    }));
  };

  const updateKzEditForm = (i, field, value) => {
    setKzEditForm((prev) => ({ ...prev, [i]: { ...prev[i], [field]: value } }));
  };

  const saveKZ = (i) => {
    const form = kzEditForm[i];
    if (!form) return;
    setKillZones((prev) =>
      prev.map((kz, idx) =>
        idx === i
          ? {
              name: form.name?.trim() || kz.name,
              start: form.start || kz.start,
              end: form.end || kz.end,
            }
          : kz,
      ),
    );
    setOpenKZEdit((prev) => prev.filter((x) => x !== i));
  };

  const addKillZone = () => {
    setKillZones((prev) => {
      const updated = [
        ...prev,
        { name: 'New Kill Zone', start: '09:00', end: '12:00' },
      ];
      const newIndex = updated.length - 1;
      setKzEditForm((f) => ({
        ...f,
        [newIndex]: { name: 'New Kill Zone', start: '09:00', end: '12:00' },
      }));
      setOpenKZEdit((o) => [...o, newIndex]);
      return updated;
    });
  };

  const deleteKZ = (i) => {
    setKillZones((prev) => prev.filter((_, idx) => idx !== i));
    setOpenKZEdit((prev) =>
      prev.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)),
    );
  };

  // ── Checklist ──
  const nextStatus = (current) => {
    const idx = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  };

  const cycleStatus = (i) => {
    setChecklist((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, status: nextStatus(item.status) } : item,
      ),
    );
  };

  const deleteItem = (i) =>
    setChecklist((prev) => prev.filter((_, idx) => idx !== i));

  const addItem = () => {
    const val = clInput.trim();
    if (!val) return;
    setChecklist((prev) => [...prev, { label: val, status: 'pending' }]);
    setClInput('');
  };

  const calcScore = () => {
    const total = checklist.length;
    const confirmed = checklist.filter((i) => i.status === 'confirmed').length;
    const failed = checklist.filter((i) => i.status === 'failed').length;
    const pending = checklist.filter((i) => i.status === 'pending').length;
    const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    let grade;
    if (pct >= 100) grade = 'A+';
    else if (pct >= 80) grade = 'A';
    else if (pct >= 60) grade = 'B';
    else if (pct >= 40) grade = 'C';
    else grade = 'F';

    let status, statusClass;
    if (failed > 0) {
      status = 'SETUP INVALID — SKIP TRADE';
      statusClass = 'invalid';
    } else if (pending > 0) {
      status = 'WAIT FOR CONFIRMATION';
      statusClass = 'wait';
    } else {
      status = 'PLACE ORDER';
      statusClass = 'ready';
    }

    let gradeClass;
    if (grade === 'A+' || grade === 'A') gradeClass = 'grade-a';
    else if (grade === 'B') gradeClass = 'grade-b';
    else if (grade === 'C') gradeClass = 'grade-c';
    else gradeClass = 'grade-f';

    return { pct, grade, gradeClass, status, statusClass };
  };
  const score = calcScore();

  // ── Timezone Panel ──
  const toggleTZPanel = () => {
    if (!tzPanelOpen) {
      setTzForm({
        iana: timezone.iana,
        label: timezone.label,
        offsetDisplay: timezone.offsetDisplay,
      });
    }
    setTzPanelOpen((prev) => !prev);
  };

  const saveTZ = () => {
    setTimezone({
      iana: tzForm.iana,
      label: tzForm.label.trim() || tzForm.iana,
      offsetDisplay: tzForm.offsetDisplay.trim() || '',
    });
    setTzPanelOpen(false);
  };

  // ── Quote Modal ──
  const openQuoteModal = (mode, index = -1) => {
    setModalMode(mode);
    setModalEditIndex(index);
    if (mode === 'edit' && index >= 0) {
      const q = quotes[index];
      const p1 = parseLine(q.line1);
      const p2 = parseLine(q.line2);
      setModalLine1(p1.tokens.join(' '));
      setModalLine2(p2.tokens.join(' '));
      setModalHighlights({ l1: p1.highlighted, l2: p2.highlighted });
    } else {
      setModalLine1('');
      setModalLine2('');
      setModalHighlights({ l1: [], l2: [] });
    }
    setQuoteModalOpen(true);
  };

  const closeQuoteModal = () => setQuoteModalOpen(false);

  const toggleChip = (lineKey, index) => {
    setModalHighlights((prev) => {
      const current = prev[lineKey];
      const updated = current.includes(index)
        ? current.filter((x) => x !== index)
        : [...current, index];
      return { ...prev, [lineKey]: updated };
    });
  };

  const saveQuoteModal = () => {
    const l1Tokens = tokenize(modalLine1);
    const l2Tokens = tokenize(modalLine2);
    if (
      !l1Tokens.length ||
      !l2Tokens.length ||
      (l1Tokens.length === 1 && l1Tokens[0] === '')
    )
      return;

    const line1 = buildLine(l1Tokens, modalHighlights.l1);
    const line2 = buildLine(l2Tokens, modalHighlights.l2);

    if (modalMode === 'edit' && modalEditIndex >= 0) {
      setQuotes((prev) =>
        prev.map((q, i) =>
          i === modalEditIndex ? { line1, line2, custom: q.custom } : q,
        ),
      );
      setQuoteIndex(modalEditIndex);
    } else {
      setQuotes((prev) => [...prev, { line1, line2, custom: true }]);
    }
    closeQuoteModal();
  };

  const deleteQuote = (i) => {
    if (quotes.length <= 1) {
      alert('You need at least one quote.');
      return;
    }
    setQuotes((prev) => prev.filter((_, idx) => idx !== i));
    setQuoteIndex(0);
  };

  const resetQuotes = () => {
    if (
      !window.confirm(
        'Restore default quotes to latest? Your custom quotes will be kept.',
      )
    )
      return;
    const customQuotes = quotes.filter((q) => q.custom === true);
    setQuotes([
      ...DEFAULT_QUOTES.map((q) => ({ ...q, custom: false })),
      ...customQuotes,
    ]);
    setQuoteIndex(0);
  };

  const toggleCustomOnly = () => {
    const customQuotes = quotes.filter((q) => q.custom === true);
    if (!showCustomOnly && customQuotes.length === 0) {
      alert(
        'You have no custom quotes yet. Add at least 1 custom quote first.',
      );
      return;
    }
    setShowCustomOnly((prev) => !prev);
    if (!showCustomOnly) setShowDefaultOnly(false);
    setQuoteIndex(0);
  };

  const toggleDefaultOnly = () => {
    const defaultQuotes = quotes.filter((q) => q.custom !== true);
    if (!showDefaultOnly && defaultQuotes.length === 0) {
      alert('There are no default quotes available.');
      return;
    }
    setShowDefaultOnly((prev) => !prev);
    if (!showDefaultOnly) setShowCustomOnly(false);
    setQuoteIndex(0);
  };

  // ── Clock render values ──
  const h = localNow.getHours();
  const m = localNow.getMinutes();
  const s = localNow.getSeconds();
  const digitalTime = `${pad(h)}:${pad(m)}:${pad(s)}`;
  const analogTime = `${pad(h)}:${pad(m)}`;
  const dateStr = `${DAYS[localNow.getDay()]} · ${localNow.getDate()} ${MONTHS[localNow.getMonth()]} ${localNow.getFullYear()}`;

  const secDeg = s * 6;
  const minDeg = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;

  const hHand = getHandCoords(hourDeg, 40, 40, -5, 18);
  const mHand = getHandCoords(minDeg, 40, 40, -5, 23);
  const sHand = getHandCoords(secDeg, 40, 40, -4, 26);

  const currentQuote = activeQuotes[safeQuoteIndex];

  return (
    <div className="entry-checklist-page">
      <div className="main-container">
        {/* Side Menu Overlay */}
        <div
          className={`side-menu-overlay ${sideMenuOpen ? 'open' : ''}`}
          onClick={() => setSideMenuOpen(false)}
        />

        {/* Side Menu Panel */}
        <div className={`side-menu ${sideMenuOpen ? 'open' : ''}`}>
          <div className="side-menu-header">
            <span className="side-menu-title">Menu</span>
            <button
              className="side-menu-close"
              onClick={() => setSideMenuOpen(false)}
            >
              <i className="ti ti-x" />
            </button>
          </div>

          <div className="side-menu-section">
            <div className="side-menu-section-label">Quotes</div>
            <button
              className="side-menu-item"
              onClick={() => openQuoteModal('add')}
            >
              <i className="ti ti-plus" /> Add New Quote
            </button>
            <div className="side-menu-quotes-list">
              {quotes.map((q, realIndex) => {
                if (showCustomOnly && !q.custom) return null;
                if (showDefaultOnly && q.custom) return null;
                const isThisActive = activeQuotes[safeQuoteIndex] === q;
                return (
                  <div
                    key={realIndex}
                    className={`side-quote-item ${isThisActive ? 'active-quote' : ''}`}
                  >
                    <div className="side-quote-text">
                      {q.custom ? (
                        <span className="custom-badge">Custom</span>
                      ) : (
                        <span className="default-badge">Default</span>
                      )}
                      <div
                        className="side-quote-line"
                        dangerouslySetInnerHTML={{ __html: q.line1 }}
                      />
                      <div
                        className="side-quote-line"
                        dangerouslySetInnerHTML={{ __html: q.line2 }}
                      />
                    </div>
                    <div className="side-quote-actions">
                      <button
                        className="sq-btn edit"
                        onClick={() => openQuoteModal('edit', realIndex)}
                        title="Edit"
                      >
                        <i className="ti ti-pencil" />
                      </button>
                      {q.custom && (
                        <button
                          className="sq-btn del"
                          onClick={() => deleteQuote(realIndex)}
                          title="Delete"
                        >
                          <i className="ti ti-trash" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="side-menu-section">
            <div className="side-menu-section-label">Filter</div>
            <button
              className={`side-menu-item ${showCustomOnly ? 'active-filter' : ''}`}
              onClick={toggleCustomOnly}
            >
              <i className={`ti ${showCustomOnly ? 'ti-eye-off' : 'ti-eye'}`} />{' '}
              {showCustomOnly ? 'Showing Custom Only' : 'Show Custom Only'}
            </button>
            <button
              className={`side-menu-item ${showDefaultOnly ? 'active-filter' : ''}`}
              onClick={toggleDefaultOnly}
            >
              <i
                className={`ti ${showDefaultOnly ? 'ti-eye-off' : 'ti-eye'}`}
              />{' '}
              {showDefaultOnly ? 'Showing Default Only' : 'Show Default Only'}
            </button>
          </div>

          <div className="side-menu-section">
            <div className="side-menu-section-label">Danger Zone</div>
            <button className="side-menu-item danger" onClick={resetQuotes}>
              <i className="ti ti-refresh" /> Restore Default Quotes
            </button>
          </div>
        </div>

        {/* Quote Modal */}
        <div
          className={`quote-modal-overlay ${quoteModalOpen ? 'open' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQuoteModal();
          }}
        >
          <div className="quote-modal">
            <div className="quote-modal-title">
              {modalMode === 'edit' ? 'Edit Quote' : 'Add New Quote'}
            </div>
            <div className="quote-modal-body">
              <label>Line 1</label>
              <input
                type="text"
                value={modalLine1}
                onChange={(e) => setModalLine1(e.target.value)}
                placeholder="e.g. Trade with discipline"
                maxLength={60}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveQuoteModal();
                  if (e.key === 'Escape') closeQuoteModal();
                }}
              />
              <div className="chip-hint">
                Click words below to highlight them in{' '}
                <span style={{ color: '#00e676' }}>green</span>
              </div>
              <div className="word-chips">
                {modalLine1.trim() &&
                  tokenize(modalLine1).map((word, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`word-chip ${modalHighlights.l1.includes(i) ? 'highlighted' : ''}`}
                      onClick={() => toggleChip('l1', i)}
                    >
                      {word}
                    </button>
                  ))}
              </div>

              <label>Line 2</label>
              <input
                type="text"
                value={modalLine2}
                onChange={(e) => setModalLine2(e.target.value)}
                placeholder="e.g. and protect your capital"
                maxLength={70}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveQuoteModal();
                  if (e.key === 'Escape') closeQuoteModal();
                }}
              />
              <div className="chip-hint">
                Click words below to highlight them in{' '}
                <span style={{ color: '#00e676' }}>green</span>
              </div>
              <div className="word-chips">
                {modalLine2.trim() &&
                  tokenize(modalLine2).map((word, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`word-chip ${modalHighlights.l2.includes(i) ? 'highlighted' : ''}`}
                      onClick={() => toggleChip('l2', i)}
                    >
                      {word}
                    </button>
                  ))}
              </div>
            </div>
            <div className="quote-modal-actions">
              <button className="save-btn" onClick={saveQuoteModal}>
                Save
              </button>
              <button className="cancel-btn" onClick={closeQuoteModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        <button
          className="menu-icon-btn"
          onClick={() => setSideMenuOpen(true)}
          aria-label="Edit quotes"
          title="Edit quotes"
        >
          <i className="ti ti-pencil" />
        </button>

        {/* Headline Carousel */}
        <div className="top-bar">
          <div>
            <div id="headline-carousel-wrap">
              <div
                className="headline-carousel"
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
              >
                {currentQuote && (
                  <>
                    <div
                      className="headline headline-red"
                      dangerouslySetInnerHTML={{ __html: currentQuote.line1 }}
                    />
                    <div
                      className="headline"
                      dangerouslySetInnerHTML={{ __html: currentQuote.line2 }}
                    />
                  </>
                )}
              </div>
              <div className="carousel-controls">
                <button
                  className="carousel-btn"
                  onClick={prevQuote}
                  aria-label="Previous"
                >
                  &#8592;
                </button>
                <div className="carousel-dots">
                  {activeQuotes.map((_, i) => (
                    <button
                      key={i}
                      className={`carousel-dot ${i === safeQuoteIndex ? 'active' : ''}`}
                      aria-label={`Go to quote ${i + 1}`}
                      onClick={() => goToQuote(i)}
                    />
                  ))}
                </div>
                <button
                  className="carousel-btn"
                  onClick={nextQuote}
                  aria-label="Next"
                >
                  &#8594;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timezone Panel */}
        <div className={`tz-panel ${tzPanelOpen ? 'open' : ''}`}>
          <div className="tz-panel-inner">
            <div className="tz-panel-title">Timezone Settings</div>
            <div className="tz-row">
              <label>Display Label</label>
              <input
                type="text"
                value={tzForm.label}
                onChange={(e) =>
                  setTzForm((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="e.g. Nigerian Time (WAT)"
                maxLength={40}
              />
            </div>
            <div className="tz-row">
              <label>IANA Timezone</label>
              <select
                value={tzForm.iana}
                onChange={(e) =>
                  setTzForm((prev) => ({ ...prev, iana: e.target.value }))
                }
              >
                {COMMON_TZ.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div className="tz-row">
              <label>UTC Offset Display</label>
              <input
                type="text"
                value={tzForm.offsetDisplay}
                onChange={(e) =>
                  setTzForm((prev) => ({
                    ...prev,
                    offsetDisplay: e.target.value,
                  }))
                }
                placeholder="e.g. UTC+1"
                maxLength={10}
              />
            </div>
            <div className="tz-actions">
              <button className="save-btn" onClick={saveTZ}>
                Save
              </button>
              <button className="cancel-btn" onClick={toggleTZPanel}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Kill Zones */}
          <div className="col">
            <div className="col-label">Kill Zones</div>
            <div>
              {killZones.map((kz, i) => {
                const active = isActive(kz);
                const editOpen = openKZEdit.includes(i);
                const form = kzEditForm[i] || {
                  name: kz.name,
                  start: kz.start,
                  end: kz.end,
                };
                return (
                  <div key={i} className={`kz-card ${active ? 'active' : ''}`}>
                    <div className="active-badge">Live Now</div>
                    <div className="kz-header">
                      <div className="kz-name">{kz.name}</div>
                      <div className="kz-controls">
                        <button
                          className="icon-btn"
                          onClick={() => toggleKZEdit(i)}
                          title="Edit"
                          aria-label="Edit kill zone"
                        >
                          <i className="ti ti-pencil" aria-hidden="true" />
                        </button>
                        <button
                          className="icon-btn del"
                          onClick={() => deleteKZ(i)}
                          title="Delete"
                          aria-label="Delete kill zone"
                        >
                          <i className="ti ti-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="kz-time">
                      {kz.start} – {kz.end}
                    </div>
                    <div className="kz-tz-label">{timezone.offsetDisplay}</div>
                    <div className={`edit-row ${editOpen ? 'open' : ''}`}>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          updateKzEditForm(i, 'name', e.target.value)
                        }
                        placeholder="Zone name"
                      />
                      <input
                        type="time"
                        value={form.start}
                        onChange={(e) =>
                          updateKzEditForm(i, 'start', e.target.value)
                        }
                      />
                      <span className="edit-row-sep">–</span>
                      <input
                        type="time"
                        value={form.end}
                        onChange={(e) =>
                          updateKzEditForm(i, 'end', e.target.value)
                        }
                      />
                      <button className="save-btn" onClick={() => saveKZ(i)}>
                        Save
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => toggleKZEdit(i)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="add-kz-btn" onClick={addKillZone}>
              <i className="ti ti-plus" /> Add Kill Zone
            </button>
          </div>

          {/* Clocks */}
          <div className="col clock-col">
            <div className="col-label">Live Time</div>
            <div className="clock-card">
              <div className="clock-type">Digital</div>
              <div className="digital-time">{digitalTime}</div>
              <div className="digital-date">{dateStr}</div>
            </div>
            <div className="clock-card">
              <div className="clock-type">Analog</div>
              <div className="analog-wrap">
                <svg
                  className="analog-svg"
                  width="90"
                  height="90"
                  viewBox="0 0 80 80"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#1e1e2e"
                    strokeWidth="1.5"
                  />
                  <circle cx="40" cy="40" r="33" fill="#0a0a14" />
                  <line
                    x1="40"
                    y1="13"
                    x2="40"
                    y2="18"
                    stroke="#222"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="40"
                    y1="62"
                    x2="40"
                    y2="67"
                    stroke="#222"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="13"
                    y1="40"
                    x2="18"
                    y2="40"
                    stroke="#222"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="62"
                    y1="40"
                    x2="67"
                    y2="40"
                    stroke="#222"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={hHand.x1}
                    y1={hHand.y1}
                    x2={hHand.x2}
                    y2={hHand.y2}
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={mHand.x1}
                    y1={mHand.y1}
                    x2={mHand.x2}
                    y2={mHand.y2}
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={sHand.x1}
                    y1={sHand.y1}
                    x2={sHand.x2}
                    y2={sHand.y2}
                    stroke="#00e676"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <circle cx="40" cy="40" r="2.5" fill="#00e676" />
                </svg>
                <div>
                  <div className="analog-label">{analogTime}</div>
                  <div className="analog-sub">{timezone.offsetDisplay}</div>
                </div>
              </div>
            </div>
            <div className="clock-card">
              <div style={{ textAlign: 'right' }}>
                <div className="top-tz-label">{timezone.label}</div>
                <div className="top-time">{analogTime}</div>
                <button className="tz-edit-btn" onClick={toggleTZPanel}>
                  <i className="ti ti-settings" /> Edit Timezone
                </button>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="col">
            <div className="col-label">Entry Checklist</div>
            <div className="add-row">
              <input
                type="text"
                value={clInput}
                onChange={(e) => setClInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addItem();
                }}
                placeholder="Add checklist item..."
                maxLength={40}
              />
              <button
                className="add-icon-btn"
                onClick={addItem}
                aria-label="Add item"
              >
                <i className="ti ti-plus" />
              </button>
            </div>
            <div>
              {checklist.map((item, i) => {
                const st = item.status;
                return (
                  <div key={i} className="cl-item">
                    <div
                      className={`cl-check ${st}`}
                      onClick={() => cycleStatus(i)}
                      role="checkbox"
                      aria-checked={st === 'confirmed'}
                      tabIndex={0}
                      title="Click to cycle: Pending → Confirmed → Failed"
                    >
                      {st === 'confirmed' && (
                        <svg viewBox="0 0 12 12" fill="none">
                          <path
                            d="M1.5 6L5 9.5L10.5 2.5"
                            stroke="#0a0a0f"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {st === 'failed' && (
                        <svg viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 2L10 10M10 2L2 10"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className={`cl-name ${st}`}>{item.label}</div>
                    <span className={`cl-status-tag ${st}`}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </span>
                    <button
                      className="cl-del"
                      onClick={() => deleteItem(i)}
                      aria-label="Remove item"
                      title="Remove"
                    >
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="score-row">
              <span className="score-label">Score / Grade</span>
              <span className={`score-value ${score.gradeClass}`}>
                {score.pct}% &nbsp;|&nbsp; {score.grade}
              </span>
            </div>
            <div className={`status-banner ${score.statusClass}`}>
              {score.status}
            </div>
          </div>
        </div>

        <div className="footer">
          <div className="footer-brand">
            <span className="dot" />
            Corepips Chart Pro
          </div>
          <div className="footer-tag">Smart Money · ICT · Price Action</div>
        </div>
      </div>
    </div>
  );
};

export default EntryChecklist;
