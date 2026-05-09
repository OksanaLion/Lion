/* NOVA PROTOCOL — interactive prototype */
const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "parallaxIntensity": 1,
  "spotlightRadius": 420,
  "spotlightIntensity": 0.55,
  "grain": true,
  "speed": 1,
  "palette": "violet"
}/*EDITMODE-END*/;

/* ---------- Cursor + spotlight ---------- */
function CursorFX() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      document.documentElement.style.setProperty('--mx', mx + 'px');
      document.documentElement.style.setProperty('--my', my + 'px');
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      }
    };
    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      }
      requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', move);
    const id = requestAnimationFrame(tick);

    // hover detection
    const hoverables = 'a, button, .magnetic, .gallery-tile, .cast-card, .seat, .timeline-item';
    const onOver = (e) => { if (e.target.closest(hoverables)) document.body.classList.add('cursor-hover'); };
    const onOut  = (e) => { if (e.target.closest(hoverables)) document.body.classList.remove('cursor-hover'); };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(id);
    };
  }, []);
  return (
    <>
      <div className="cursor" ref={dotRef}></div>
      <div className="cursor-ring" ref={ringRef}></div>
      <div className="spotlight"></div>
    </>
  );
}

/* ---------- Reveal on scroll ---------- */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          // stagger words inside
          const words = e.target.querySelectorAll('.word');
          words.forEach((w, i) => setTimeout(() => w.classList.add('in'), i * 60));
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* split text into animated words */
const Words = ({ text, className = "" }) => (
  <span className={className}>
    {text.split(' ').map((w, i) => (
      <span key={i} className="word" style={{ marginRight: '0.25em' }}>{w}</span>
    ))}
  </span>
);

/* ---------- Magnetic button ---------- */
const Magnetic = ({ children, strength = 0.3, ...rest }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const onLeave = () => { ref.current.style.transform = 'translate(0,0)'; };
  return (
    <span ref={ref} className="magnetic" onMouseMove={onMove} onMouseLeave={onLeave}
          style={{ display: 'inline-block', transition: 'transform 0.25s ease' }} {...rest}>
      {children}
    </span>
  );
};

/* ---------- Parallax wrapper ---------- */
function useParallax(ref, factor = 0.3) {
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--parallax-i')) || 1;
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * factor * intensity;
      ref.current.style.transform = `translate3d(0, ${-offset}px, 0)`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [factor]);
}

/* ---------- Hero ---------- */
function Hero({ openTrailer }) {
  const orbRef = useRef(null);
  const ringRef = useRef(null);
  const gridRef = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--parallax-i')) || 1;
      if (orbRef.current) orbRef.current.style.transform = `translateY(calc(-50% + ${y * 0.35 * intensity}px)) scale(${1 + y * 0.0003})`;
      if (ringRef.current) ringRef.current.style.transform = `translateY(calc(-50% + ${y * 0.2 * intensity}px))`;
      if (gridRef.current) gridRef.current.style.transform = `translate3d(0, ${y * 0.15 * intensity}px, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-grid" ref={gridRef}></div>
      <div className="hero-orb-ring" ref={ringRef}></div>
      <div className="hero-orb" ref={orbRef}></div>

      {/* lens flares */}
      <div className="flare" style={{ top: '20%', right: '10%', width: 200, height: 200,
        background: 'radial-gradient(circle, oklch(0.85 0.18 55 / 0.6), transparent 70%)' }}></div>
      <div className="flare" style={{ bottom: '15%', left: '20%', width: 280, height: 280,
        background: 'radial-gradient(circle, oklch(0.65 0.22 290 / 0.5), transparent 70%)' }}></div>

      <div className="hero-content">
        <div className="hero-meta reveal">
          <span>Trailer 12.04.2026</span>
          <span>IMAX · Dolby</span>
          <span>2h 18m</span>
        </div>
        <h1 className="hero-title display reveal">
          <span className="line"><Words text="NOVA" /></span>
          <span className="line stroke"><Words text="PROTOCOL" /></span>
        </h1>
        <div className="hero-sub reveal">
          <p>Когда последний орбитальный реактор гаснет над Землёй, инженер-беглец возвращается на станцию, чтобы перезапустить протокол, который человечество должно было забыть.</p>
          <div className="hero-actions">
            <Magnetic>
              <button className="btn btn-primary" onClick={openTrailer}>
                ▶ Смотреть трейлер
              </button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <a href="#booking" className="btn btn-ghost">
                Купить билет <span className="arrow">→</span>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      <div className="hero-bottom">
        <div>v.01 / chapter — initiation</div>
        <div className="scroll-cue">
          <span>scroll</span>
          <span className="line"></span>
          <span>down</span>
        </div>
        <div>©NOVA · 2026</div>
      </div>
    </section>
  );
}

/* ---------- Marquee ---------- */
const Marquee = () => (
  <div className="marquee">
    <div className="marquee-track">
      {[...Array(2)].map((_, i) => (
        <span key={i}>
          <span>NOVA PROTOCOL</span>
          <span>IN CINEMAS APR 12</span>
          <span>ORIGINAL SCORE</span>
          <span>IMAX EXPERIENCE</span>
          <span>CHAPTER ONE</span>
        </span>
      ))}
    </div>
  </div>
);

/* ---------- Sticky synopsis ---------- */
function StickySection() {
  const cards = [
    { num: "01 / RESET", t: "Орбитальный коллапс", d: "Реактор Helios-9 теряет синхронизацию. Земля впервые за 40 лет видит ночное небо без сетки." },
    { num: "02 / RETURN", t: "Беглец возвращается", d: "Кай Орен — единственный, кто помнит ручной запуск. Его статус: \"стёрт\". Его доступ: невозможен." },
    { num: "03 / RECOIL", t: "Цена перезапуска", d: "Сквозь пустую станцию, через эхо собственных решений. То, что осталось от системы — теперь живёт само." },
  ];
  return (
    <section className="sticky-section container" data-screen-label="02 Synopsis">
      <div className="sticky-grid">
        <div className="sticky-left reveal">
          <div className="sticky-eyebrow eyebrow">Синопсис</div>
          <h2 className="sticky-title display">
            Три акта.<br/>
            Один <span style={{ color: 'var(--orange)' }}>протокол</span>.<br/>
            Никаких компромиссов.
          </h2>
          <div className="sticky-meta">
            <div className="sticky-meta-row"><span>Жанр</span><strong>SCI-FI / THRILLER</strong></div>
            <div className="sticky-meta-row"><span>Режиссёр</span><strong>М. ВЕРГА</strong></div>
            <div className="sticky-meta-row"><span>Композитор</span><strong>А. ХЕЛЬДЕР</strong></div>
            <div className="sticky-meta-row"><span>Возраст</span><strong>16+</strong></div>
            <div className="sticky-meta-row"><span>Прокат</span><strong>12 АПР 2026</strong></div>
          </div>
        </div>
        <div className="sticky-right">
          {cards.map((c, i) => (
            <div className="sticky-card reveal" key={i}>
              <div className="num">{c.num}</div>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
              <div className="placeholder">SCENE PLACEHOLDER · {String(i + 1).padStart(2, '0')}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Cast ---------- */
function Cast() {
  const cast = [
    { role: "Главная роль", name: "Кай Орен", actor: "Илья Маркес", tag: "01 / FUGITIVE" },
    { role: "Координатор", name: "Лира Ваан", actor: "София Чен", tag: "02 / ANCHOR" },
    { role: "Антагонист", name: "Архив-7", actor: "Джонас Реми", tag: "03 / GHOST" },
    { role: "Инженер", name: "М. Корелл", actor: "Авив Тал", tag: "04 / WRENCH" },
    { role: "Командир", name: "Веспа", actor: "Нур Альсаид", tag: "05 / VOICE" },
  ];
  return (
    <section className="cast" data-screen-label="03 Cast">
      <div className="cast-head container">
        <h2 className="display reveal"><Words text="В РОЛЯХ" /></h2>
        <div className="eyebrow reveal">Прокрутите →</div>
      </div>
      <div className="cast-track">
        {cast.map((c, i) => (
          <div className="cast-card" key={i}>
            <div className="cast-img" data-tag={c.tag}></div>
            <div className="cast-info">
              <div className="role">{c.role}</div>
              <div className="name">{c.name}</div>
              <div className="actor">{c.actor}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Timeline ---------- */
function Timeline() {
  const numLeftRef = useRef(null);
  const numRightRef = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      if (!numLeftRef.current) return;
      const r = numLeftRef.current.parentElement.getBoundingClientRect();
      const i = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--parallax-i')) || 1;
      const t = (window.innerHeight / 2 - r.top) * 0.3 * i;
      numLeftRef.current.style.transform = `translate3d(${-t}px, 0, 0)`;
      numRightRef.current.style.transform = `translate3d(${t}px, 0, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const acts = [
    { n: "ACT I", t: "Падение сигнала", d: "Тишина в радиусе 400 км. Первый признак того, что протокол ещё помнит сам себя." },
    { n: "ACT II", t: "Подъём на орбиту", d: "Старая капсула, ручное управление. Каждый километр — диалог с тем, что было оставлено." },
    { n: "ACT III", t: "Перезапуск", d: "Машина, которая больше не машина. Решение, которое нельзя отменить." },
    { n: "ACT IV", t: "После", d: "Земля впервые видит небо. Кай впервые молчит." },
  ];
  return (
    <section className="timeline container" data-screen-label="04 Timeline">
      <div className="timeline-bg"></div>
      <div className="timeline-numbers left display" ref={numLeftRef}>04</div>
      <div className="timeline-numbers right display" ref={numRightRef}>26</div>
      <div className="eyebrow reveal" style={{ marginBottom: 48 }}>Структура</div>
      <div className="timeline-list">
        {acts.map((a, i) => (
          <div className="timeline-item" key={i}>
            <div className="t-num">{a.n}</div>
            <div className="t-title display">{a.t}</div>
            <div className="t-desc">{a.d}</div>
            <div className="t-arrow">→</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Gallery ---------- */
function Gallery() {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
    e.currentTarget.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
  };
  const tiles = [
    { c: 't-1', label: "Cold open · 00:42", num: "001" },
    { c: 't-2', label: "Capsule interior", num: "002" },
    { c: 't-3', label: "Helios approach", num: "003" },
    { c: 't-4', label: "Archive-7", num: "004" },
    { c: 't-5', label: "Final frame", num: "005" },
  ];
  return (
    <section className="gallery container" data-screen-label="05 Gallery">
      <div className="gallery-head">
        <div>
          <div className="eyebrow reveal" style={{ marginBottom: 24 }}>Галерея</div>
          <h2 className="display reveal"><Words text="КАДРЫ ИЗ ФИЛЬМА" /></h2>
        </div>
        <Magnetic strength={0.2}>
          <a className="btn btn-ghost">Все материалы <span className="arrow">→</span></a>
        </Magnetic>
      </div>
      <div className="gallery-grid">
        {tiles.map((t, i) => (
          <div key={i} className={`gallery-tile ${t.c}`} data-label={t.label} data-num={t.num} onMouseMove={onMove}>
            <div className="tile-glow"></div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Booking ---------- */
function Booking() {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("Москва");
  const [date, setDate] = useState("12.04.2026");
  const [time, setTime] = useState("21:00");
  const [hall, setHall] = useState("IMAX");
  const [seats, setSeats] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const taken = [3, 4, 11, 12, 19, 28, 29, 36];
  const toggleSeat = (i) => {
    if (taken.includes(i)) return;
    setSeats((s) => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);
  };
  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const total = seats.length * 850;

  return (
    <section className="booking container" id="booking" data-screen-label="06 Booking">
      <div className="eyebrow reveal" style={{ marginBottom: 40 }}>Бронирование</div>
      <div className="booking-card">
        <div className="booking-art">
          <div>
            <div className="eyebrow" style={{ marginBottom: 24, color: 'var(--ink)' }}>Сеанс</div>
            <h3>{date}<br/>{time} · {hall}</h3>
          </div>
          <div className="booking-stats">
            <div className="s">Город<strong>{city}</strong></div>
            <div className="s">Зал<strong>{hall}</strong></div>
            <div className="s">Места<strong>{seats.length || "—"}</strong></div>
            <div className="s">Сумма<strong>{total ? total + " ₽" : "—"}</strong></div>
          </div>
        </div>
        <div className="booking-form">
          <div className="steps">
            {["Сеанс", "Места", "Контакты", "Оплата"].map((s, i) => (
              <div key={i} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                {String(i + 1).padStart(2, '0')} · {s}
              </div>
            ))}
          </div>

          {step === 0 && (
            <>
              <div className="field">
                <label>Город</label>
                <select value={city} onChange={(e) => setCity(e.target.value)}>
                  <option>Москва</option><option>Санкт-Петербург</option><option>Казань</option>
                </select>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Дата</label>
                  <select value={date} onChange={(e) => setDate(e.target.value)}>
                    <option>12.04.2026</option><option>13.04.2026</option><option>14.04.2026</option>
                  </select>
                </div>
                <div className="field">
                  <label>Время</label>
                  <select value={time} onChange={(e) => setTime(e.target.value)}>
                    <option>18:30</option><option>21:00</option><option>23:30</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Зал</label>
                <select value={hall} onChange={(e) => setHall(e.target.value)}>
                  <option>IMAX</option><option>Dolby Atmos</option><option>4DX</option>
                </select>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="screen-arc"></div>
              <div className="seat-grid">
                {[...Array(40)].map((_, i) => (
                  <button key={i}
                    className={`seat ${seats.includes(i) ? 'selected' : ''} ${taken.includes(i) ? 'taken' : ''}`}
                    onClick={() => toggleSeat(i)}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                <span>● свободно</span>
                <span style={{ color: 'var(--orange)' }}>● выбрано</span>
                <span style={{ opacity: 0.4 }}>● занято</span>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="field">
                <label>Имя</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Кай Орен" />
              </div>
              <div className="field">
                <label>Телефон</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 ___ ___ __ __" />
              </div>
              <div className="field">
                <label>Email</label>
                <input placeholder="you@nova.protocol" />
              </div>
            </>
          )}
          {step === 3 && (
            <div className="summary">
              <div className="summary-row"><span className="k">Фильм</span><span className="v">NOVA PROTOCOL</span></div>
              <div className="summary-row"><span className="k">Сеанс</span><span className="v">{date} · {time}</span></div>
              <div className="summary-row"><span className="k">Зал</span><span className="v">{hall} · {city}</span></div>
              <div className="summary-row"><span className="k">Места</span><span className="v">{seats.length ? seats.map(s => s+1).join(', ') : '—'}</span></div>
              <div className="summary-row total"><span className="k">Итого</span><span className="v">{total} ₽</span></div>
            </div>
          )}

          <div className="form-actions">
            {step > 0
              ? <Magnetic strength={0.2}><button className="btn btn-ghost" onClick={prev}>← Назад</button></Magnetic>
              : <span></span>}
            {step < 3
              ? <Magnetic><button className="btn btn-primary" onClick={next}>Далее <span className="arrow">→</span></button></Magnetic>
              : <Magnetic><button className="btn btn-primary" onClick={() => alert("Бронь подтверждена · идёт расшифровка...")}>Оплатить {total} ₽</button></Magnetic>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Modal ---------- */
function TrailerModal({ open, close }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);
  return (
    <div className={`modal-bg ${open ? 'open' : ''}`} onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-art"></div>
        <button className="modal-play" aria-label="play">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="0" /></svg>
        </button>
        <button className="modal-close" onClick={close}>✕</button>
      </div>
    </div>
  );
}

/* ---------- Footer ---------- */
const Footer = () => (
  <footer className="footer container" data-screen-label="07 Footer">
    <div className="footer-huge display">NOVA PROTOCOL</div>
    <div className="footer-grid">
      <div>
        <h4>Связаться</h4>
        <p style={{ color: 'var(--ink-dim)', maxWidth: 360 }}>Прокатное расписание, IMAX-сеансы, пресс-материалы и оригинальный саундтрек — на одной странице.</p>
        <div style={{ marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--orange)' }}>press@novaprotocol.film</div>
      </div>
      <div>
        <h4>Сайт</h4>
        <ul><li><a>Синопсис</a></li><li><a>В ролях</a></li><li><a>Галерея</a></li><li><a>Билеты</a></li></ul>
      </div>
      <div>
        <h4>Соцсети</h4>
        <ul><li><a>Twitter</a></li><li><a>Instagram</a></li><li><a>Telegram</a></li><li><a>YouTube</a></li></ul>
      </div>
      <div>
        <h4>Юр.</h4>
        <ul><li><a>Лицензия</a></li><li><a>Прокатное удост.</a></li><li><a>Cookies</a></li></ul>
      </div>
    </div>
    <div className="footer-bottom">
      <div>©2026 NOVA Originals</div>
      <div>Built with light & noise</div>
      <div>v.01.04</div>
    </div>
  </footer>
);

/* ---------- Tweaks ---------- */
function Tweaks() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--parallax-i', t.parallaxIntensity);
    r.style.setProperty('--spotlight-r', t.spotlightRadius + 'px');
    r.style.setProperty('--spotlight-i', t.spotlightIntensity);
    r.style.setProperty('--grain-on', t.grain ? 1 : 0);
    r.style.setProperty('--speed', t.speed);
    // palette
    if (t.palette === 'amber') {
      r.style.setProperty('--orange', 'oklch(0.78 0.16 70)');
      r.style.setProperty('--violet', 'oklch(0.45 0.10 60)');
      r.style.setProperty('--bg-0', 'oklch(0.07 0.02 60)');
    } else if (t.palette === 'cyan') {
      r.style.setProperty('--orange', 'oklch(0.78 0.18 200)');
      r.style.setProperty('--violet', 'oklch(0.55 0.20 320)');
      r.style.setProperty('--bg-0', 'oklch(0.08 0.04 240)');
    } else {
      r.style.setProperty('--orange', 'oklch(0.74 0.19 55)');
      r.style.setProperty('--violet', 'oklch(0.55 0.22 290)');
      r.style.setProperty('--bg-0', 'oklch(0.08 0.06 285)');
    }
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Эффекты" />
      <TweakSlider label="Parallax" value={t.parallaxIntensity} min={0} max={2} step={0.05}
        onChange={(v) => setT('parallaxIntensity', v)} />
      <TweakSlider label="Радиус spotlight" value={t.spotlightRadius} min={100} max={900} step={10} unit="px"
        onChange={(v) => setT('spotlightRadius', v)} />
      <TweakSlider label="Яркость spotlight" value={t.spotlightIntensity} min={0} max={1.2} step={0.05}
        onChange={(v) => setT('spotlightIntensity', v)} />
      <TweakToggle label="Film grain" value={t.grain} onChange={(v) => setT('grain', v)} />
      <TweakSection label="Палитра" />
      <TweakRadio label="Тон" value={t.palette}
        options={['violet', 'amber', 'cyan']}
        onChange={(v) => setT('palette', v)} />
    </TweaksPanel>
  );
}

/* ---------- App ---------- */
function App() {
  const [trailerOpen, setTrailer] = useState(false);
  useReveal();
  return (
    <>
      <CursorFX />
      <div className="bg-stage"></div>
      <div className="grain"></div>

      <nav className="nav">
        <div className="nav-logo"><span className="dot"></span>NOVA</div>
        <div className="nav-links">
          <a>Синопсис</a><a>В ролях</a><a>Галерея</a><a>Билеты</a>
        </div>
        <Magnetic strength={0.2}>
          <a className="nav-cta" href="#booking">Купить билет</a>
        </Magnetic>
      </nav>

      <Hero openTrailer={() => setTrailer(true)} />
      <Marquee />
      <StickySection />
      <Cast />
      <Timeline />
      <Gallery />
      <Marquee />
      <Booking />
      <Footer />

      <TrailerModal open={trailerOpen} close={() => setTrailer(false)} />
      <Tweaks />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
