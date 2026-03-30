"use client";

import { useState } from "react";
import SearchBox from "@/components/SearchBox";
import Recommendations from "@/components/Recommendations";
import Stats from "@/components/Stats";
import api from "@/lib/api";

export default function Home() {
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getRecommendations = async (book: any) => {
    setSelectedBook(book);
    setLoading(true);

    try {
      const res = await api.post("/recommend", {
        query: book.title,
        top_n: 5,
      });
      setRecommendations(res.data);
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-root">
      {/* Decorative background layer */}
      <div className="bg-texture" aria-hidden />

      <div className="page-wrapper">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="site-header">
          <div className="header-eyebrow">Curated Reading Intelligence</div>
          <h1 className="site-title">
            <span className="title-icon">✦</span>
            Bibliophile
          </h1>
          <p className="site-subtitle">
            Discover your next great read through collaborative taste
          </p>
        </header>

        {/* ── Stats ──────────────────────────────────────────── */}
        <Stats />

        {/* ── Divider ────────────────────────────────────────── */}
        <div className="ornament-divider">
          <span />
          <span className="ornament-glyph">◆</span>
          <span />
        </div>

        {/* ── Search ─────────────────────────────────────────── */}
        <section className="search-section">
          <label className="search-label">Find a book you love</label>
          <SearchBox onSelect={getRecommendations} />
        </section>

        {/* ── Loading ────────────────────────────────────────── */}
        {loading && (
          <div className="loading-block">
            <div className="loading-dots">
              <span /><span /><span />
            </div>
            <p>Consulting the catalogue…</p>
          </div>
        )}

        {/* ── Selected book context ──────────────────────────── */}
        {selectedBook && !loading && recommendations.length > 0 && (
          <div className="context-pill">
            Because you liked <em>{selectedBook.title}</em>
          </div>
        )}

        {/* ── Recommendations ────────────────────────────────── */}
        <Recommendations data={recommendations} />
      </div>

      <style jsx global>{`
        /* ─── Fonts ─────────────────────────────────────────── */
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400;500&display=swap');

        /* ─── Tokens ─────────────────────────────────────────── */
        :root {
          --cream:       #f5f0e8;
          --parchment:   #ede6d6;
          --tan:         #c9b99a;
          --sepia:       #8b6f47;
          --ink:         #1e1410;
          --ink-soft:    #3d2e1e;
          --accent:      #b34a2a;
          --accent-pale: #f0e0d8;
          --gold:        #c8933a;
          --card-bg:     #faf7f2;
          --shadow:      rgba(30,20,10,0.10);
          --shadow-deep: rgba(30,20,10,0.20);

          --font-serif:  'Cormorant Garamond', Georgia, serif;
          --font-mono:   'DM Mono', monospace;
          --font-sans:   'Outfit', sans-serif;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--parchment);
          color: var(--ink);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }

        /* ─── Page shell ─────────────────────────────────────── */
        .page-root {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        .bg-texture {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, #e8dcc8 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, #d9cdb8 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .page-wrapper {
          position: relative;
          z-index: 1;
          max-width: 760px;
          margin: 0 auto;
          padding: 60px 24px 100px;
        }

        /* ─── Header ─────────────────────────────────────────── */
        .site-header {
          text-align: center;
          margin-bottom: 52px;
          animation: fadeUp 0.7s ease both;
        }

        .header-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--sepia);
          margin-bottom: 16px;
        }

        .site-title {
          font-family: var(--font-serif);
          font-size: clamp(52px, 10vw, 86px);
          font-weight: 300;
          line-height: 0.95;
          color: var(--ink);
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }

        .title-icon {
          color: var(--accent);
          font-size: 0.55em;
          line-height: 1;
        }

        .site-subtitle {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 17px;
          color: var(--sepia);
          margin-top: 14px;
          font-weight: 300;
        }

        /* ─── Ornament ───────────────────────────────────────── */
        .ornament-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 40px 0;
          animation: fadeUp 0.7s 0.15s ease both;
        }

        .ornament-divider span:not(.ornament-glyph) {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--tan), transparent);
        }

        .ornament-glyph {
          color: var(--gold);
          font-size: 10px;
        }

        /* ─── Stats ──────────────────────────────────────────── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 40px;
          animation: fadeUp 0.7s 0.05s ease both;
        }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-grid > *:last-child { grid-column: 1 / -1; }
        }

        .stat-card {
          background: var(--card-bg);
          border: 1px solid rgba(139,111,71,0.18);
          border-radius: 4px;
          padding: 16px 12px;
          text-align: center;
          box-shadow: 0 2px 8px var(--shadow);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px var(--shadow-deep);
        }

        .stat-value {
          font-family: var(--font-serif);
          font-size: 26px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1;
          display: block;
        }

        .stat-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--sepia);
          margin-top: 5px;
          display: block;
        }

        /* ─── Search ─────────────────────────────────────────── */
        .search-section {
          margin-bottom: 36px;
          animation: fadeUp 0.7s 0.2s ease both;
        }

        .search-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--sepia);
          margin-bottom: 10px;
        }

        .search-wrapper {
          position: relative;
        }

        .search-input {
          width: 100%;
          background: var(--card-bg);
          border: 1.5px solid var(--tan);
          border-radius: 4px;
          padding: 16px 20px;
          font-family: var(--font-serif);
          font-size: 19px;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px var(--shadow);
        }

        .search-input::placeholder {
          color: var(--tan);
          font-style: italic;
        }

        .search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(179,74,42,0.10), 0 2px 8px var(--shadow);
        }

        .search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: var(--card-bg);
          border: 1.5px solid var(--tan);
          border-radius: 4px;
          box-shadow: 0 8px 32px var(--shadow-deep);
          overflow: hidden;
          z-index: 50;
          animation: dropDown 0.18s ease;
        }

        .search-result {
          padding: 14px 20px;
          cursor: pointer;
          border-bottom: 1px solid rgba(139,111,71,0.12);
          transition: background 0.15s;
        }

        .search-result:last-child { border-bottom: none; }

        .search-result:hover { background: var(--accent-pale); }

        .result-title {
          font-family: var(--font-serif);
          font-size: 17px;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.2;
        }

        .result-author {
          font-family: var(--font-sans);
          font-size: 12px;
          color: var(--sepia);
          margin-top: 3px;
        }

        /* ─── Context pill ───────────────────────────────────── */
        .context-pill {
          display: inline-block;
          background: var(--accent-pale);
          border: 1px solid rgba(179,74,42,0.25);
          border-radius: 20px;
          padding: 6px 16px;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--accent);
          margin-bottom: 24px;
          animation: fadeUp 0.4s ease both;
        }

        .context-pill em { font-style: italic; }

        /* ─── Loading ─────────────────────────────────────────── */
        .loading-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 40px 0;
          color: var(--sepia);
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 16px;
        }

        .loading-dots {
          display: flex;
          gap: 8px;
        }

        .loading-dots span {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 1.2s ease infinite;
        }

        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        /* ─── Recommendations ────────────────────────────────── */
        .recs-header {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--sepia);
          margin-bottom: 18px;
        }

        .recs-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .rec-card {
          background: var(--card-bg);
          border: 1px solid rgba(139,111,71,0.18);
          border-radius: 4px;
          padding: 22px 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: start;
          gap: 16px;
          box-shadow: 0 2px 10px var(--shadow);
          transition: transform 0.22s, box-shadow 0.22s;
          animation: fadeUp 0.5s ease both;
        }

        .rec-card:nth-child(1) { animation-delay: 0.05s; }
        .rec-card:nth-child(2) { animation-delay: 0.10s; }
        .rec-card:nth-child(3) { animation-delay: 0.15s; }
        .rec-card:nth-child(4) { animation-delay: 0.20s; }
        .rec-card:nth-child(5) { animation-delay: 0.25s; }

        .rec-card:hover {
          transform: translateX(4px);
          box-shadow: 0 6px 24px var(--shadow-deep);
          border-left: 3px solid var(--accent);
          padding-left: 21px;
        }

        .rec-rank {
          font-family: var(--font-serif);
          font-size: 11px;
          color: var(--tan);
          margin-bottom: 6px;
          letter-spacing: 0.1em;
        }

        .rec-title {
          font-family: var(--font-serif);
          font-size: 21px;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.25;
          margin-bottom: 4px;
        }

        .rec-author {
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--sepia);
          font-weight: 300;
        }

        .rec-metrics {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .metric-badge {
          text-align: right;
        }

        .metric-value {
          font-family: var(--font-mono);
          font-size: 15px;
          font-weight: 400;
          color: var(--ink);
          display: block;
        }

        .metric-label {
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--tan);
          display: block;
        }

        .confidence-bar-wrap {
          width: 60px;
          height: 3px;
          background: var(--parchment);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 2px;
        }

        .confidence-bar-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        /* ─── Animations ─────────────────────────────────────── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </main>
  );
}