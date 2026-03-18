import React, { useState, useEffect } from "react";
import { Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModernDropdown from "../components/Dropdown";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

/* ── helper: map role slug → readable label ── */
const ROLE_LABELS = {
  frontend:       "Front-end Developer",
  python_backend: "Python Developer",
  java_backend:   "Java Developer",
};

/* ── helper: colour per role ── */
const ROLE_COLORS = {
  frontend:       "#00D1FF",
  python_backend: "#FFB800",
  java_backend:   "#FF2FB3",
};

/* ── helper: time-ago string ── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

const Dashboard = () => {
  const [role, setRole]                   = useState("");
  const [difficulty, setDifficulty]       = useState("");
  const [mode, setMode]                   = useState("Practice Mode");
  const [questionsCount, setQuestionsCount] = useState(5);
  const [starting, setStarting] = useState(false);

  /* ── recent activity state ── */
  const [recent, setRecent]     = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const navigate    = useNavigate();
  const { user }    = useAuth();
  const firstName   = user?.name ? user.name.split(" ")[0] : "there";

  /* ── fetch last 3 sessions on mount ── */
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await axios.get(
          "http://127.0.0.1:8000/interview/sessions?limit=3",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecent(res.data.sessions ?? res.data);
      } catch (err) {
        console.error("Failed to fetch recent sessions:", err);
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchRecent();
  }, []);

  const handleStartInterview = async () => {
    setStarting(true);
    try {
      const token    = localStorage.getItem("token");
      const response = await axios.post(
        "http://127.0.0.1:8000/interview/start",
        {
          role,
          difficulty: difficulty.toLowerCase(),
          mode: mode === "Practice Mode" ? "practice" : "interview",
          questions_count: Number(questionsCount),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      localStorage.setItem("session_id", data.session_id);
      navigate("/interview", { state: data });
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/login");
      } else {
        console.error(error);
        setStarting(false);
      }
    }
  };

  const roleOptions = [
    { label: "Front-end Developer", value: "frontend"       },
    { label: "Python Developer",    value: "python_backend" },
    { label: "Java Developer",      value: "java_backend"   },
  ];
  const difficultyOptions = [
    { label: "Easy",   value: "Easy"   },
    { label: "Medium", value: "Medium" },
    { label: "Hard",   value: "Hard"   },
  ];
  const modeOptions = [
    { id: "Practice Mode",  icon: "🎯", label: "Practice Mode",  sub: "Instant per-question feedback" },
    { id: "Interview Mode", icon: "🏆", label: "Interview Mode", sub: "Verdict at the end"            },
  ];

  /* ── Score display: prefer average_score, fall back to verdict ── */
  const formatScore = (session) => {
    if (session.average_score != null && session.average_score > 0)
      return `${session.average_score.toFixed(1)}/10`;
    if (session.verdict) return session.verdict;
    return "—";
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#04040a" }}>
      <div className="absolute rounded-full animate-orb pointer-events-none"
        style={{ width: 550, height: 550, background: "rgba(123,63,242,0.12)", top: 0, right: -100, filter: "blur(90px)" }} />
      <div className="absolute rounded-full animate-orb pointer-events-none"
        style={{ width: 380, height: 380, background: "rgba(0,209,255,0.08)", bottom: 0, left: -60, filter: "blur(90px)", animationDelay: "6s" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-7 pt-20 pb-16">

        {/* Welcome */}
        <div className="animate-fade-up mb-9">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>
            Welcome back, <span className="grad-text">{firstName}!</span>
          </h1>
          <p className="text-sm text-white/40">Ready to ace your next interview? Let's get started.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Config card (unchanged) ── */}
          <div className="lg:col-span-2 rounded-2xl p-8 animate-fade-up-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
            <h2 className="text-xl font-bold mb-7" style={{ fontFamily: "'Syne', sans-serif" }}>Configure Your Interview</h2>

            {/* Role + Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <ModernDropdown label="Interview Role"   options={roleOptions}       value={role}       onChange={setRole}       placeholder="Select a role..."  className="cursor-pointer"      />
              <ModernDropdown label="Difficulty Level" options={difficultyOptions} value={difficulty} onChange={setDifficulty} placeholder="Select difficulty..." className="cursor-pointer"   />
              
            </div>

            {/* Mode toggle */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-white/50 mb-2.5">Interview Mode</label>
              <div className="flex gap-3">
                {modeOptions.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className="flex-1 p-3.5 rounded-2xl text-left text-sm font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      background: mode === m.id ? "linear-gradient(135deg, rgba(0,209,255,0.12), rgba(123,63,242,0.12))" : "rgba(255,255,255,0.03)",
                      border:     `1px solid ${mode === m.id ? "rgba(0,209,255,0.45)" : "rgba(255,255,255,0.08)"}`,
                      color:      mode === m.id ? "#00D1FF" : "rgba(255,255,255,0.5)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                    <div className="font-semibold mb-0.5">{m.icon} {m.label}</div>
                    <div className="text-[11px]" style={{ color: mode === m.id ? "rgba(0,209,255,0.55)" : "rgba(255,255,255,0.28)" }}>{m.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div className="mb-8">
              <label className="block text-xs font-medium text-white/50 mb-2.5">Number of Questions</label>
              <div className="flex items-center gap-2">
                {[3, 5, 7, 10].map(n => (
                  <button key={n} onClick={() => setQuestionsCount(n)}
                    className="w-11 h-9 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      background: questionsCount == n ? "linear-gradient(135deg, rgba(0,209,255,0.2), rgba(123,63,242,0.2))" : "rgba(255,255,255,0.04)",
                      border:     `1px solid ${questionsCount == n ? "rgba(0,209,255,0.5)" : "rgba(255,255,255,0.08)"}`,
                      color:      questionsCount == n ? "#00D1FF" : "rgba(255,255,255,0.5)",
                    }}>{n}</button>
                ))}
                <input
                  type="number" min="1" max="20" value={questionsCount}
                  onChange={e => setQuestionsCount(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "'DM Sans', sans-serif" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(0,209,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)";  e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={handleStartInterview} disabled={!role || !difficulty || starting}
                className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}>
                {starting ? (
                  <>
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Generating Questions…
                  </>
                ) : (
                  <><Mic size={15} /> Start Interview</>
                )}
              </button>
              <button
                onClick={() => navigate("/activity")}
                className="flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium text-white/65 transition-all duration-200 hover:text-white cursor-pointer"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.4)"; e.currentTarget.style.background = "rgba(0,209,255,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
                View Previous Reports
              </button>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-5">

            {/* ── Recent Activity (now dynamic) ── */}
            <div className="rounded-2xl p-6 animate-fade-up-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
              <h3 className="text-sm font-bold text-white/65 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Recent Activity</h3>

              {/* Loading skeleton */}
              {loadingRecent && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="py-3 flex justify-between items-start animate-pulse">
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.07)" }} />
                        <div className="h-2.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
                      </div>
                      <div className="flex flex-col gap-1.5 items-end">
                        <div className="h-2.5 w-12 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
                        <div className="h-3 w-10 rounded" style={{ background: "rgba(255,255,255,0.07)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loadingRecent && recent.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-xs text-white/30">No sessions yet.</p>
                  <p className="text-xs text-white/20 mt-1">Start your first interview above!</p>
                </div>
              )}

              {/* Session rows */}
              {!loadingRecent && recent.map((session, i) => (
                <div key={session.id}
                  className="py-3.5 flex justify-between items-start"
                  style={{ borderBottom: i < recent.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div>
                    <div className="text-sm font-semibold mb-1.5">
                      {ROLE_LABELS[session.role] ?? session.role}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                      {session.mode === "practice" ? "Practice Mode" : "Interview Mode"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-white/30 mb-1">{timeAgo(session.created_at)}</div>
                    <div className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: ROLE_COLORS[session.role] ?? "#00D1FF" }}>
                      {formatScore(session)}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => navigate("/activity")}
                className="w-full mt-3.5 py-2.5 rounded-xl text-xs font-medium text-[#00D1FF] transition-all duration-200 cursor-pointer"
                style={{ background: "rgba(0,209,255,0.06)", border: "1px solid rgba(0,209,255,0.2)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,209,255,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,209,255,0.06)"; }}>
                View All Activities
              </button>
            </div>

            {/* Quick tips (unchanged) */}
            <div className="rounded-2xl p-6 animate-fade-up-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
              <h3 className="text-sm font-bold text-white/65 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>💡 Quick Tips</h3>
              {[
                "Practice common interview questions daily to build confidence.",
                "Record yourself to analyze clarity and filler words.",
                "Research the company and role thoroughly.",
                "Explain your thought process, not just the answer.",
                "Prepare thoughtful questions to ask at the end.",
              ].map((t, i) => (
                <div key={i} className="flex gap-2.5 mb-2.5 text-xs text-white/40 leading-relaxed">
                  <span className="text-[#00D1FF] shrink-0 mt-0.5">▸</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;