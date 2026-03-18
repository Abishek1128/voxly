import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PolarRadiusAxis,
} from "recharts";
import { ChevronLeft, TrendingUp, Target, Zap, Award, Activity } from "lucide-react";
import Navbar from "../components/Navbar";
import axios from "axios";

/* ─── helpers ─────────────────────────────────────────── */
const ROLE_LABELS = {
  frontend: "Front-end",
  python_backend: "Python",
  java_backend: "Java",
};
const ROLE_COLORS = {
  frontend: "#00D1FF",
  python_backend: "#FFB800",
  java_backend: "#FF2FB3",
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/* ─── Custom tooltip ──────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 14px", fontFamily: "'DM Sans',sans-serif" }}>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700, fontSize: 14, margin: "2px 0" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          {p.name === "Score" ? "/10" : ""}
        </p>
      ))}
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "20px 24px", backdropFilter: "blur(20px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color, margin: "0 0 4px" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

/* ─── Chart card wrapper ──────────────────────────────── */
function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px", backdropFilter: "blur(20px)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, margin: "0 0 4px", color: "#fff" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────── */
function EmptyChart({ msg = "No data yet" }) {
  return (
    <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <Activity size={28} color="rgba(0,209,255,0.25)" />
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>{msg}</p>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 20, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

/* ══════════════════════════════════════════════════════════ */
const AnalyticsPage = () => {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");

  const [sessions, setSessions] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");

  /* ── fetch all sessions (up to 100) + stats ── */
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get("http://127.0.0.1:8000/interview/sessions?limit=100&sort=oldest", { headers }),
      axios.get("http://127.0.0.1:8000/auth/stats", { headers }),
    ]).then(([sessRes, statsRes]) => {
      setSessions(sessRes.data.sessions ?? []);
      setStats(statsRes.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [token]);

  /* ── derived data ── */
  const filtered = roleFilter === "all"
    ? sessions
    : sessions.filter(s => s.role === roleFilter);

  // Score over time (line chart)
  const scoreTimeline = filtered
    .filter(s => s.average_score > 0)
    .map(s => ({
      date:  formatDate(s.created_at),
      Score: parseFloat(s.average_score.toFixed(1)),
      mode:  s.mode,
    }));

  // Sessions per week (bar chart)
  const weekMap = {};
  filtered.forEach(s => {
    const d    = new Date(s.created_at);
    const week = `W${getWeekNumber(d)} '${String(d.getFullYear()).slice(2)}`;
    weekMap[week] = (weekMap[week] || 0) + 1;
  });
  const weeklyData = Object.entries(weekMap).slice(-8).map(([week, count]) => ({ week, Sessions: count }));

  // Avg score per role (bar chart)
  const roleMap = {};
  sessions.forEach(s => {
    if (!s.average_score || s.average_score === 0) return;
    if (!roleMap[s.role]) roleMap[s.role] = { total: 0, count: 0 };
    roleMap[s.role].total += s.average_score;
    roleMap[s.role].count += 1;
  });
  const roleData = Object.entries(roleMap).map(([role, d]) => ({
    role:  ROLE_LABELS[role] ?? role,
    Score: parseFloat((d.total / d.count).toFixed(1)),
    color: ROLE_COLORS[role] ?? "#00D1FF",
  }));

  // Radar: skill breakdown (derived from latest 10 sessions)
  const last10      = [...sessions].reverse().slice(0, 10).filter(s => s.average_score > 0);
  const avgScore10  = last10.length ? last10.reduce((a, s) => a + s.average_score, 0) / last10.length : 0;
  const practiceAvg = last10.filter(s => s.mode === "practice").map(s => s.average_score);
  const intrvAvg    = last10.filter(s => s.mode === "interview").map(s => s.average_score);
  const pAvg        = practiceAvg.length ? practiceAvg.reduce((a, b) => a + b, 0) / practiceAvg.length : 0;
  const iAvg        = intrvAvg.length    ? intrvAvg.reduce((a, b) => a + b, 0)    / intrvAvg.length    : 0;

  const radarData = [
    { skill: "Practice",     value: Math.round(pAvg * 100) },
    { skill: "Interview",    value: Math.round(iAvg * 100) },
    { skill: "Consistency",  value: Math.min(sessions.length * 8, 100) },
    { skill: "Improvement",  value: scoreTimeline.length > 1 ? Math.round(Math.max(0, (scoreTimeline[scoreTimeline.length-1].Score - scoreTimeline[0].Score) / scoreTimeline[0].Score * 100 + 50)) : 50 },
    { skill: "Volume",       value: Math.min(sessions.length * 5, 100) },
  ];

  // Streaks / best
  const bestSession = sessions.filter(s => s.average_score > 0).sort((a, b) => b.average_score - a.average_score)[0];
  const recentTrend = scoreTimeline.length >= 3
    ? (scoreTimeline[scoreTimeline.length-1].Score - scoreTimeline[scoreTimeline.length-3].Score).toFixed(1)
    : null;

  const roles = ["all", "frontend", "python_backend", "java_backend"];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#04040a", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 48px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} h={110} r={20} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} h={260} r={20} />)}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#04040a", color: "#fff", fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* bg orbs */}
      <div style={{ position: "absolute", width: 500, height: 500, background: "rgba(123,63,242,0.1)", top: -80, right: -80, filter: "blur(90px)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 360, height: 360, background: "rgba(0,209,255,0.07)", bottom: 60, left: -60, filter: "blur(90px)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />

      <Navbar />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "90px 48px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, fontFamily: "'DM Sans',sans-serif", transition: "color 0.2s", padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#00D1FF"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
            <ChevronLeft size={14} /> Back to Dashboard
          </button>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, margin: "0 0 6px" }}>
                Performance{" "}
                <span style={{ background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Analytics
                </span>
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} tracked
              </p>
            </div>

            {/* Role filter pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roles.map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif",
                    background: roleFilter === r ? "rgba(0,209,255,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${roleFilter === r ? "rgba(0,209,255,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: roleFilter === r ? "#00D1FF" : "rgba(255,255,255,0.45)",
                  }}>
                  {r === "all" ? "All Roles" : ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard icon={Activity}  label="Total Sessions"  value={stats?.total_sessions ?? 0}           sub={`${stats?.interview_sessions ?? 0} interviews · ${stats?.practice_sessions ?? 0} practice`} color="#00D1FF" />
          <StatCard icon={TrendingUp} label="Average Score"  value={`${stats?.average_score_pct ?? 0}%`}  sub="across all sessions"    color="#7B3FF2" />
          <StatCard icon={Award}      label="Best Score"     value={`${stats?.best_score_pct ?? 0}%`}     sub={bestSession ? `on ${formatDate(bestSession.created_at)}` : "no sessions yet"} color="#FFB800" />
          <StatCard icon={Zap}        label="Recent Trend"   value={recentTrend !== null ? (recentTrend > 0 ? `+${recentTrend}` : `${recentTrend}`) : "—"} sub="vs 3 sessions ago (0–10)" color={recentTrend > 0 ? "#28C840" : recentTrend < 0 ? "#FF2FB3" : "#888"} />
        </div>

        {/* ── Charts row 1 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Score over time */}
          <ChartCard title="Score Over Time" subtitle="Your performance trend across all sessions">
            {scoreTimeline.length < 2
              ? <EmptyChart msg="Complete 2+ scored sessions to see your trend" />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={scoreTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Score" stroke="#00D1FF" strokeWidth={2.5} dot={{ fill: "#00D1FF", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#00D1FF", boxShadow: "0 0 8px #00D1FF" }} />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>

          {/* Skill Radar */}
          <ChartCard title="Skill Profile" subtitle="Based on recent sessions">
            {sessions.length < 2
              ? <EmptyChart msg="Need more sessions" />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#7B3FF2" fill="#7B3FF2" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>
        </div>

        {/* ── Charts row 2 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Sessions per week */}
          <ChartCard title="Sessions Per Week" subtitle="How consistently you've been practising">
            {weeklyData.length === 0
              ? <EmptyChart msg="No sessions yet" />
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Sessions" fill="#7B3FF2" radius={[6,6,0,0]}>
                      {weeklyData.map((_, i) => (
                        <rect key={i} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>

          {/* Avg score per role */}
          <ChartCard title="Score by Role" subtitle="Average performance across interview tracks">
            {roleData.length === 0
              ? <EmptyChart msg="Complete scored sessions to compare roles" />
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={roleData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="role" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Score" radius={[6,6,0,0]}
                      fill="#00D1FF"
                      label={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </ChartCard>
        </div>

        {/* ── Mode breakdown ── */}
        {sessions.length > 0 && (
          <div style={{ marginTop: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px 28px", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>Session Breakdown</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Practice vs Interview split</p>
            </div>
            {/* Progress bar */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#00D1FF", fontWeight: 600 }}>🎯 Practice  {stats?.practice_sessions ?? 0}</span>
                <span style={{ fontSize: 12, color: "#FFB800", fontWeight: 600 }}>{stats?.interview_sessions ?? 0}  Interview 🏆</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #00D1FF, #7B3FF2)", width: `${stats?.total_sessions ? (stats.practice_sessions / stats.total_sessions) * 100 : 50}%`, transition: "width 0.8s ease" }} />
              </div>
            </div>
            {[
              { label: "Total", value: stats?.total_sessions ?? 0, color: "#fff" },
              { label: "Practice", value: stats?.practice_sessions ?? 0, color: "#00D1FF" },
              { label: "Interview", value: stats?.interview_sessions ?? 0, color: "#FFB800" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color, margin: "0 0 2px" }}>{value}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── week number helper ── */
function getWeekNumber(d) {
  const date  = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day   = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export default AnalyticsPage;