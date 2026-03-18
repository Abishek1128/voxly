import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

/* ─── helpers ─────────────────────────────────────────── */
const ROLE_LABELS = {
  frontend:       "Front-end Developer",
  python_backend: "Python Developer",
  java_backend:   "Java Developer",
};

function scoreColor(pct) {
  if (pct >= 75) return "#00D1FF";
  if (pct >= 50) return "#FFB800";
  return "#FF2FB3";
}

/* ─── Skeleton ────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 14, mb = 0 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 7, background: "rgba(255,255,255,0.07)", marginBottom: mb, animation: "pulse 1.5s ease-in-out infinite" }} />
  );
}

/* ─── Incomplete state ────────────────────────────────── */
function Incomplete({ navigate }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Session Incomplete</h2>
      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
        This practice session was not fully completed.<br />
        Complete all questions to see your full feedback.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        style={{ background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", border: "none", color: "#fff", fontWeight: 600, borderRadius: 12, padding: "12px 28px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
        ← Back to Dashboard
      </button>
    </div>
  );
}

/* ── Score ring ───────────────────────────────────────── */
function ScoreRing({ pct, score10 }) {
  const r   = 38;
  const c   = scoreColor(pct);
  const arc = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Overall Score</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 40, color: c }}>{score10}</span>
          <span style={{ fontSize: 20, color: "rgba(255,255,255,0.2)" }}>/10</span>
        </div>
      </div>
      <svg width="78" height="78" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={c} strokeWidth="8"
          strokeDasharray={arc} strokeDashoffset={arc * (1 - pct / 100)}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ filter: `drop-shadow(0 0 5px ${c}99)` }} />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PracticeFeedback  —  Practice Mode
══════════════════════════════════════════════════════════ */
const PracticeFeedback = () => {
  const navigate      = useNavigate();
  const { sessionId } = useParams();
  const token         = localStorage.getItem("token");
  const id            = sessionId || localStorage.getItem("session_id");

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!id) { setLoading(false); setError("no_id"); return; }
    axios.get(`http://127.0.0.1:8000/interview/report/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setData(res.data))
    .catch(err => {
      console.error(err);
      setError(err.response?.status === 404 ? "not_found" : "incomplete");
    })
    .finally(() => setLoading(false));
  }, [id]);

  /* ── derived display values ── */
  const session   = data?.session   || {};
  const stats     = data?.stats     || {};
  const responses = data?.responses || [];

  const avgPct     = stats.average_pct      ?? 0;
  const avgScore10 = stats.average_score_10 ?? 0;
  const totalQ     = stats.total_questions  ?? 0;
  const voice      = stats.voice_confidence ?? "Unknown";
  const role       = ROLE_LABELS[session.role] ?? session.role ?? "Practice";

  const metrics = [
    {
      label: "Relevance",
      note: avgPct >= 75
        ? "Answers were highly relevant and on-point."
        : avgPct >= 50
        ? "Generally addressed the question but lacked specific details."
        : "Answers need to focus more directly on what was asked.",
    },
    {
      label: "Clarity",
      note: voice === "High"
        ? "Responses were clear and well-structured."
        : voice === "Medium"
        ? "Some hesitations affected clarity. Structure thoughts before speaking."
        : "Work on reducing filler words and speaking more clearly.",
    },
    {
      label: "Confidence",
      note: voice === "High"
        ? "Delivered answers with conviction and composure."
        : voice === "Medium"
        ? "Mostly confident with some moments of hesitation."
        : "Practice speaking with more conviction. Pausing is fine.",
    },
    {
      label: "Filler Words",
      note: voice === "High"
        ? "Very minimal filler words. Clean delivery."
        : voice === "Medium"
        ? "Some filler words detected. Use deliberate pauses instead."
        : "High usage of filler words. Slow down and pause to collect thoughts.",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative overflow-hidden" style={{ background: "#04040a" }}>
        <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 450, height: 450, background: "rgba(123,63,242,0.12)", top: 0, right: 0, filter: "blur(90px)" }} />
        <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 350, height: 350, background: "rgba(255,47,179,0.08)", bottom: 0, left: 0, filter: "blur(90px)", animationDelay: "6s" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-20 pb-16">

          {loading && (
            <div style={{ padding: "60px 0" }}>
              <Skeleton h={20} w={140} mb={20} />
              <Skeleton h={36} w={280} mb={36} />
              <Skeleton h={100} mb={14} />
              <Skeleton h={100} mb={14} />
            </div>
          )}

          {!loading && (error === "incomplete" || error === "not_found" || error === "no_id") && (
            <Incomplete navigate={navigate} />
          )}

          {!loading && !error && data && (
            <>
              {/* Header */}
              <div className="text-center mb-9 animate-fade-up">
                <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest mb-4"
                  style={{ background: "rgba(0,209,255,0.1)", border: "1px solid rgba(0,209,255,0.3)", color: "#00D1FF" }}>
                  Practice Mode · {role}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Answer Feedback</h1>
              </div>

              {/* Score card */}
              <div className="rounded-2xl px-6 py-5 mb-4 flex items-center justify-between animate-fade-up-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
                <ScoreRing pct={avgPct} score10={avgScore10} />
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{totalQ} questions answered</p>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                    padding: "4px 10px", borderRadius: 6,
                    background: `${scoreColor(avgPct)}18`, border: `1px solid ${scoreColor(avgPct)}44`,
                    color: scoreColor(avgPct),
                  }}>
                    {avgPct >= 75 ? "Great performance!" : avgPct >= 50 ? "Could be stronger" : "Keep practicing"}
                  </span>
                </div>
              </div>

              {/* Per-question responses */}
              {responses.length > 0 && (
                <div className="flex flex-col gap-3.5 mb-5">
                  {responses.map((r, i) => {
                    const c = scoreColor(r.score_pct);
                    return (
                      <div key={i} className={`rounded-2xl px-6 py-5 animate-fade-up-${Math.min(i+2,5)}`}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                            Question {i + 1}
                          </p>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: "'Syne',sans-serif", whiteSpace: "nowrap" }}>
                            {r.score_pct}%
                          </span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed mb-3">{r.question}</p>
                        {/* Score bar */}
                        <div style={{ height: 3, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                          <div style={{ height: "100%", width: `${r.score_pct}%`, borderRadius: 4, background: c, boxShadow: `0 0 5px ${c}66`, transition: "width 0.7s ease" }} />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
                            Voice: {r.voice_confidence || "—"}
                          </span>
                          <span style={{ fontSize: 10, color: c }}>
                            {r.score_pct >= 75 ? "✓ Strong" : r.score_pct >= 50 ? "~ Moderate" : "✗ Needs work"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Metric grid — same design as original */}
              <div className="grid grid-cols-2 gap-3.5 mb-7">
                {metrics.map((m, i) => (
                  <div key={i} className={`rounded-2xl p-5 animate-fade-up-4 transition-all duration-200 hover:-translate-y-0.5`}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.28)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <h3 className="font-bold text-sm mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{m.label}</h3>
                    <p className="text-xs text-white/40 leading-relaxed">{m.note}</p>
                  </div>
                ))}
              </div>

              {/* Actions — same design as original */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center px-6 py-2.5 rounded-xl text-sm font-medium text-white/65 transition-all duration-200 hover:text-white"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.4)"; e.currentTarget.style.background = "rgba(0,209,255,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                >← Back to Dashboard</button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", backgroundSize: "200%", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}
                >🎤 New Practice Session</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PracticeFeedback;