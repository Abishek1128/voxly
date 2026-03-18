import React, { useState, useEffect } from "react";
import { Share2, Zap, Star } from "lucide-react";
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

function starRating(pct) {
  // map 0-100% → 0-5 stars in 0.5 steps
  return Math.round((pct / 100) * 5 * 2) / 2;
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
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Interview Incomplete</h2>
      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
        This session was not fully completed.<br />
        Please finish all questions to see your full report.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        style={{ background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", border: "none", color: "#fff", fontWeight: 600, borderRadius: 12, padding: "12px 28px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
        ← Back to Dashboard
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FinalReport  —  Interview Mode
══════════════════════════════════════════════════════════ */
const FinalReport = () => {
  const navigate  = useNavigate();
  const { sessionId } = useParams();
  const token     = localStorage.getItem("token");

  // also support sessionId stored in localStorage (from InterviewSession redirect)
  const id = sessionId || localStorage.getItem("session_id");

  const [data,    setData]    = useState(null);   // full report from API
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

  const card      = "rounded-2xl backdrop-blur-xl";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };

  /* ── derive display data from API response ── */
  const session   = data?.session   || {};
  const stats     = data?.stats     || {};
  const responses = data?.responses || [];

  const avgPct      = stats.average_pct    ?? 0;
  const avgScore10  = stats.average_score_10 ?? 0;
  const totalQ      = stats.total_questions  ?? 0;
  const voice       = stats.voice_confidence ?? "Unknown";
  const verdict     = session.verdict        ?? "";
  const role        = ROLE_LABELS[session.role] ?? session.role ?? "Interview";
  const difficulty  = session.difficulty ?? "";

  // map verdict string → display label
  const verdictLabel = verdict.toLowerCase().includes("excellent") ? "Excellent Candidate"
    : verdict.toLowerCase().includes("good")     ? "Good Candidate"
    : verdict.toLowerCase().includes("strong")   ? "Strong Candidate"
    : verdict || "Interview Complete";

  // skill breakdown — derive from per-response scores
  const skillAreas = responses.length > 0 ? [
    {
      title: "Technical Knowledge",
      rating: starRating(avgPct),
      total: 5,
      note: avgPct >= 75
        ? "Solid understanding of core concepts with good depth."
        : avgPct >= 50
        ? "Decent grasp of concepts, room to go deeper."
        : "Core concepts need more study and practice.",
    },
    {
      title: "Communication Skills",
      rating: starRating(voice === "High" ? 90 : voice === "Medium" ? 65 : 40),
      total: 5,
      note: voice === "High"   ? "Clear and concise, easy to follow."
          : voice === "Medium" ? "Generally clear with some hesitations."
          : "Work on speaking with more confidence and structure.",
    },
    {
      title: "Confidence",
      rating: starRating(voice === "High" ? 85 : voice === "Medium" ? 60 : 35),
      total: 5,
      note: voice === "High"   ? "Spoke with conviction and composure."
          : voice === "Medium" ? "Mostly confident, some moments of hesitation."
          : "Practice delivering answers with more conviction.",
    },
    {
      title: "Problem Solving",
      rating: starRating(Math.min(avgPct + 5, 100)),
      total: 5,
      note: avgPct >= 70
        ? "Approached problems logically with good reasoning."
        : "Could benefit from a more structured problem-solving approach.",
    },
  ] : [];

  const commMetrics = [
    { label: "Voice Confidence", value: voice,
      color: voice === "High" ? "#00D1FF" : voice === "Medium" ? "#FFB800" : "#FF2FB3" },
    { label: "Avg Score",   value: `${avgScore10}/10`,  color: scoreColor(avgPct)   },
    { label: "Questions",   value: `${totalQ} answered`, color: "rgba(255,255,255,0.5)" },
    { label: "Difficulty",  value: difficulty || "—",   color: "#7B3FF2"            },
  ];

  const suggestions = avgPct < 50 ? [
    { title: "Strengthen Core Concepts",    desc: "Focus on fundamentals of your target role. Build a habit of daily practice with structured explanations." },
    { title: "Practice Structured Answers", desc: "Use the STAR or PREP framework. Structure gives clarity and shows logical thinking." },
    { title: "Record & Review",             desc: "Record yourself answering questions and review for filler words, pacing, and clarity." },
  ] : avgPct < 75 ? [
    { title: "Deepen Technical Details",        desc: "Good foundation — now go deeper into implementation details, edge cases, and trade-offs." },
    { title: "Structured Problem-Solving",      desc: "Explicitly outline your approach before answering. This shows methodical thinking." },
    { title: "Engage with Follow-up Questions", desc: "Anticipate follow-ups and incorporate proactive answers. It demonstrates critical thinking." },
  ] : [
    { title: "Maintain Your Edge",              desc: "Great performance. Keep practicing advanced topics and system design to stay sharp." },
    { title: "Mock Interviews",                 desc: "Try timed mock interviews to simulate real pressure and refine your delivery." },
    { title: "Peer Review",                     desc: "Get feedback from peers or mentors on your strongest and weakest answer areas." },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#04040a" }}>
      <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 500, height: 500, background: "rgba(0,209,255,0.07)", top: 0, right: 0, filter: "blur(90px)" }} />
      <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 400, height: 400, background: "rgba(123,63,242,0.1)", bottom: 0, left: 0, filter: "blur(90px)", animationDelay: "6s" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-7 pt-20 pb-16">

        {loading && (
          <div style={{ padding: "60px 0" }}>
            <Skeleton h={20} w={160} mb={24} />
            <Skeleton h={40} w={320} mb={40} />
            <Skeleton h={120} mb={16} />
            <Skeleton h={120} mb={16} />
          </div>
        )}

        {!loading && (error === "incomplete" || error === "not_found") && (
          <Incomplete navigate={navigate} />
        )}

        {!loading && !error && data && (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-9 flex-wrap gap-4 animate-fade-up">
              <div>
                <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest mb-3"
                  style={{ background: "rgba(0,209,255,0.1)", border: "1px solid rgba(0,209,255,0.3)", color: "#00D1FF" }}>
                  Final Report · {role}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Interview Complete</h1>
              </div>
              <div className="flex gap-2.5">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white/65 transition-all duration-200 hover:text-white"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.4)"; e.currentTarget.style.background = "rgba(0,209,255,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                ><Share2 size={13} /> Export / Share</button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", backgroundSize: "200%", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}
                >+ New Interview</button>
              </div>
            </div>

            {/* Overall summary */}
            <div className={`${card} p-7 mb-5 animate-fade-up-2`} style={cardStyle}>
              <h2 className="font-bold text-lg mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>Overall Summary</h2>
              <div className="flex justify-between mb-2.5 text-sm text-white/50">
                <span>Total Questions Answered</span>
                <span className="text-white font-semibold">{totalQ}</span>
              </div>
              <div className="flex justify-between mb-3.5 text-sm text-white/50">
                <span>Overall Score</span>
                <span className="font-extrabold text-lg" style={{ fontFamily: "'Syne', sans-serif", color: scoreColor(avgPct) }}>
                  {avgScore10}/10 <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>({avgPct}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${avgPct}%`, background: "linear-gradient(90deg, #00D1FF, #7B3FF2)", boxShadow: "0 0 14px rgba(0,209,255,0.5)" }} />
              </div>
            </div>

            {/* Skills */}
            {skillAreas.length > 0 && (
              <>
                <h2 className="font-bold text-xl mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Skill-wise Evaluation</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {skillAreas.map((s, i) => {
                    const pct = s.rating / s.total;
                    const c   = pct >= 0.8 ? "#00D1FF" : pct >= 0.65 ? "#FFB800" : "#FF2FB3";
                    return (
                      <div key={i} className={`${card} p-5 transition-all duration-200 hover:-translate-y-0.5`} style={cardStyle}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.28)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.35)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}>
                        <p className="font-bold text-sm mb-2.5" style={{ fontFamily: "'Syne', sans-serif" }}>{s.title}</p>
                        <div className="flex items-center gap-0.5 mb-2.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={12} fill={n <= Math.round(s.rating) ? c : "transparent"} color={n <= Math.round(s.rating) ? c : "rgba(255,255,255,0.15)"} />
                          ))}
                          <span className="text-xs font-semibold ml-1.5" style={{ color: c }}>{s.rating}/{s.total}</span>
                        </div>
                        <div className="h-1 rounded-full mb-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct*100}%`, background: c, boxShadow: `0 0 6px ${c}66` }} />
                        </div>
                        <p className="text-xs text-white/38 leading-relaxed">{s.note}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Communication */}
            <div className={`${card} p-7 mb-5`} style={cardStyle}>
              <h2 className="font-bold text-lg mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>Communication Analysis</h2>
              {commMetrics.map((m, i) => (
                <div key={i} className="flex justify-between items-center py-3"
                  style={{ borderBottom: i < commMetrics.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <span className="text-sm text-white/50">{m.label}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md"
                    style={{ background: `${m.color}18`, border: `1px solid ${m.color}33`, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* Per-question breakdown */}
            {responses.length > 0 && (
              <div className={`${card} p-7 mb-5`} style={cardStyle}>
                <h2 className="font-bold text-lg mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>Question Breakdown</h2>
                {responses.map((r, i) => {
                  const c = scoreColor(r.score_pct);
                  return (
                    <div key={i} className="py-3.5" style={{ borderBottom: i < responses.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <p className="text-sm text-white/70 flex-1 leading-relaxed">
                          <span style={{ color: "rgba(255,255,255,0.3)", marginRight: 8 }}>Q{i+1}.</span>{r.question}
                        </p>
                        <span className="font-bold text-sm shrink-0" style={{ fontFamily: "'Syne',sans-serif", color: c }}>
                          {r.score_pct}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${r.score_pct}%`, background: c, boxShadow: `0 0 4px ${c}66` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Verdict */}
            <div className="rounded-2xl p-9 text-center mb-6"
              style={{ background: "linear-gradient(135deg, rgba(0,209,255,0.07), rgba(123,63,242,0.07))", border: "1px solid rgba(0,209,255,0.22)" }}>
              <Zap size={30} color="#00D1FF" style={{ margin: "0 auto 12px", filter: "drop-shadow(0 0 8px rgba(0,209,255,0.6))" }} />
              <h2 className="grad-text font-extrabold text-2xl mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>{verdictLabel}</h2>
              <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">{verdict}</p>
            </div>

            {/* Suggestions */}
            <h2 className="font-bold text-xl mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Personalized Suggestions</h2>
            <div className="flex flex-col gap-3 mb-9">
              {suggestions.map((s, i) => (
                <div key={i} className={`${card} px-6 py-5 transition-all duration-200 hover:-translate-y-0.5`} style={cardStyle}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.28)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.35)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <p className="font-bold text-sm mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{s.title}</p>
                  <p className="text-xs text-white/42 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-medium text-white/65 transition-all duration-200 hover:text-white"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.4)"; e.currentTarget.style.background = "rgba(0,209,255,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >← Back to Dashboard</button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-[2] flex items-center justify-center py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", backgroundSize: "200%", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}
              >🎤 Start New Interview</button>
            </div>
          </>
        )}
      </div>

      <footer className="relative z-10 text-center py-6 text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        © 2026 VOXLY — Voice Powered Interview Intelligence
      </footer>
    </div>
  );
};

export default FinalReport;