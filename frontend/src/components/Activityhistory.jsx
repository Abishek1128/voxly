import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Clock,
  Layers,
  Trophy,
} from "lucide-react";
import Navbar from "../components/Navbar";
import axios from "axios";
import CustomDropdown from "./CustomDropdown";

/* ─── helpers ─────────────────────────────────────────── */
const ROLE_LABELS = {
  frontend: "Front-end Developer",
  python_backend: "Python Developer",
  java_backend: "Java Developer",
};

const ROLE_COLORS = {
  frontend: "#00D1FF",
  python_backend: "#FFB800",
  java_backend: "#FF2FB3",
};

const DIFFICULTY_COLORS = {
  easy: "#28C840",
  medium: "#FFB800",
  hard: "#FF2FB3",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatScore(session) {
  if (session.average_score != null && session.average_score > 0)
    return {
      text: `${session.average_score.toFixed(1)} / 10`,
      raw: session.average_score,
    };
  if (session.verdict) return { text: session.verdict, raw: null };
  return { text: "—", raw: null };
}

const PAGE_SIZE = 8;

/* ─── Score bar ───────────────────────────────────────── */
function ScoreBar({ score, color }) {
  if (score == null) return null;
  const pct = Math.min((score / 10) * 100, 100);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div
        className="flex-1 h-[3px] rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 6px ${color}88`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Session Card ────────────────────────────────────── */
function SessionCard({ session }) {
  const navigate = useNavigate();
  const color = ROLE_COLORS[session.role] ?? "#00D1FF";
  const diffCol =
    DIFFICULTY_COLORS[session.difficulty?.toLowerCase()] ?? "#888";
  const score = formatScore(session);

  return (
    <div
      className="group rounded-2xl p-5 transition-all duration-250 cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color + "44";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.35), 0 0 24px ${color}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onClick={() => navigate(`/report/${session.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Role */}
          <p
            className="font-bold text-sm text-white truncate mb-1.5"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {ROLE_LABELS[session.role] ?? session.role}
          </p>
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.38)",
              }}
            >
              {session.mode === "practice" ? "Practice" : "Interview"}
            </span>
            {session.difficulty && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: `${diffCol}15`,
                  color: diffCol,
                  border: `1px solid ${diffCol}33`,
                }}
              >
                {session.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <p
            className="font-extrabold text-lg leading-none mb-0.5"
            style={{ fontFamily: "'Syne', sans-serif", color }}
          >
            {score.text}
          </p>
          <p
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {timeAgo(session.created_at)}
          </p>
        </div>
      </div>

      {/* Score bar */}
      <ScoreBar score={score.raw} color={color} />

      {/* Bottom meta row */}
      <div
        className="flex items-center gap-4 mt-3 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-1.5">
          <Clock size={11} color="rgba(255,255,255,0.28)" />
          <span
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {formatDate(session.created_at)}
          </span>
        </div>
        {session.verdict && (
          <div className="flex items-center gap-1.5">
            <Trophy size={11} color="rgba(255,255,255,0.28)" />
            <span
              className="text-[11px] truncate max-w-[120px]"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {session.verdict}
            </span>
          </div>
        )}
        <div
          className="ml-auto text-[11px] font-semibold transition-colors duration-200 group-hover:text-white"
          style={{ color: color + "88" }}
        >
          View Report →
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton card ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex justify-between mb-3">
        <div className="flex flex-col gap-2">
          <div
            className="h-3.5 w-36 rounded"
            style={{ background: "rgba(255,255,255,0.07)" }}
          />
          <div
            className="h-2.5 w-20 rounded"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div
            className="h-5 w-14 rounded"
            style={{ background: "rgba(255,255,255,0.07)" }}
          />
          <div
            className="h-2.5 w-10 rounded"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        </div>
      </div>
      <div
        className="h-[3px] w-full rounded-full mt-2"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
    </div>
  );
}

/* ─── Pagination ──────────────────────────────────────── */
function Pagination({ page, totalPages, onPage }) {
  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase = {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.18s",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.5)",
    fontFamily: "'Syne', sans-serif",
  };
  const btnActive = {
    ...btnBase,
    background:
      "linear-gradient(135deg, rgba(0,209,255,0.18), rgba(123,63,242,0.18))",
    border: "1px solid rgba(0,209,255,0.5)",
    color: "#00D1FF",
  };
  const btnDisabled = { ...btnBase, opacity: 0.35, cursor: "not-allowed" };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
      {/* Prev */}
      <button
        style={page <= 1 ? btnDisabled : btnBase}
        onClick={() => page > 1 && onPage(page - 1)}
        onMouseEnter={(e) => {
          if (page > 1) {
            e.currentTarget.style.borderColor = "rgba(0,209,255,0.35)";
            e.currentTarget.style.color = "#fff";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.5)";
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            style={{
              ...btnBase,
              cursor: "default",
              border: "none",
              background: "transparent",
            }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            style={p === page ? btnActive : btnBase}
            onClick={() => onPage(p)}
            onMouseEnter={(e) => {
              if (p !== page) {
                e.currentTarget.style.borderColor = "rgba(0,209,255,0.35)";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (p !== page) {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }
            }}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        style={page >= totalPages ? btnDisabled : btnBase}
        onClick={() => page < totalPages && onPage(page + 1)}
        onMouseEnter={(e) => {
          if (page < totalPages) {
            e.currentTarget.style.borderColor = "rgba(0,209,255,0.35)";
            e.currentTarget.style.color = "#fff";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.5)";
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── Filter pill ─────────────────────────────────────── */
function Pill({ label, active, onClick, color = "#00D1FF" }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
      style={{
        background: active ? `${color}18` : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? color + "55" : "rgba(255,255,255,0.08)"}`,
        color: active ? color : "rgba(255,255,255,0.4)",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Main Page ───────────────────────────────────────── */
const ActivityHistory = () => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  /* filters */
  const [filterMode, setFilterMode] = useState("all"); // all | practice | interview
  const [filterRole, setFilterRole] = useState("all"); // all | frontend | python_backend | java_backend
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | highest | lowest

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Debug: confirm token exists
      console.log("Token:", token ? "found" : "MISSING");

      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        ...(filterMode !== "all" && { mode: filterMode }),
        ...(filterRole !== "all" && { role: filterRole }),
        sort: sortBy,
      });

      const url = `http://127.0.0.1:8000/interview/sessions?${params}`;
      console.log("Fetching:", url);

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Debug: log raw response
      console.log("Raw response:", res.data);

      const data = res.data;
      const list = data.sessions ?? (Array.isArray(data) ? data : []);
      const total = data.total ?? list.length;
      const pages = data.pages ?? Math.ceil(total / PAGE_SIZE);

      console.log("Sessions parsed:", list.length, "of", total);

      setSessions(list);
      setTotalCount(total);
      setTotalPages(Math.max(1, pages));
    } catch (err) {
      console.error(
        "Failed to fetch sessions:",
        err.response?.status,
        err.response?.data ?? err.message,
      );
    } finally {
      setLoading(false);
    }
  }, [page, filterMode, filterRole, sortBy]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /* reset to page 1 when filters change */
  useEffect(() => {
    setPage(1);
  }, [filterMode, filterRole, sortBy]);

  const modeFilters = [
    { value: "all", label: "All Modes" },
    { value: "practice", label: "Practice" },
    { value: "interview", label: "Interview" },
  ];
  const roleFilters = [
    { value: "all", label: "All Roles" },
    { value: "frontend", label: "Front-end" },
    { value: "python_backend", label: "Python" },
    { value: "java_backend", label: "Java" },
  ];
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "highest", label: "Highest Score" },
    { value: "lowest", label: "Lowest Score" },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "#04040a",
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* bg orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: "rgba(123,63,242,0.1)",
          top: -60,
          right: -80,
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 360,
          height: 360,
          background: "rgba(0,209,255,0.07)",
          bottom: 0,
          left: -60,
          filter: "blur(90px)",
        }}
      />
      {/* grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-7 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-medium mb-5 transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#00D1FF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.35)";
            }}
          >
            <ChevronLeft size={14} /> Back to Dashboard
          </button>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Activity{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#00D1FF,#7B3FF2)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  History
                </span>
              </h1>
              <p
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {loading
                  ? "Loading…"
                  : `${totalCount} session${totalCount !== 1 ? "s" : ""} total`}
              </p>
            </div>

            {/* Sort */}
            {/* <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium outline-none appearance-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
              }}
            >
              {sortOptions.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  style={{ background: "#111" }}
                >
                  {o.label}
                </option>
              ))}
            </select> */}
            <CustomDropdown
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {modeFilters.map((f) => (
              <Pill
                key={f.value}
                label={f.label}
                active={filterMode === f.value}
                onClick={() => setFilterMode(f.value)}
                color="#00D1FF"
              />
            ))}
          </div>
          <div
            className="w-px self-stretch"
            style={{ background: "rgba(255,255,255,0.07)" }}
          />
          <div className="flex flex-wrap gap-1.5">
            {roleFilters.map((f) => (
              <Pill
                key={f.value}
                label={f.label}
                active={filterRole === f.value}
                onClick={() => setFilterRole(f.value)}
                color="#7B3FF2"
              />
            ))}
          </div>
        </div>

        {/* Stats strip */}
        {!loading &&
          sessions.length > 0 &&
          (() => {
            const withScores = sessions.filter((s) => s.average_score > 0);
            const avgScore = withScores.length
              ? (
                  withScores.reduce((a, s) => a + s.average_score, 0) /
                  withScores.length
                ).toFixed(1)
              : null;
            const practiceN = sessions.filter(
              (s) => s.mode === "practice",
            ).length;
            const interviewN = sessions.filter(
              (s) => s.mode === "interview",
            ).length;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  {
                    icon: BarChart2,
                    label: "Avg Score",
                    value: avgScore ? `${avgScore}/10` : "—",
                    color: "#00D1FF",
                  },
                  {
                    icon: Layers,
                    label: "This Page",
                    value: sessions.length,
                    color: "#7B3FF2",
                  },
                  {
                    icon: Trophy,
                    label: "Practice",
                    value: practiceN,
                    color: "#FF2FB3",
                  },
                  {
                    icon: Trophy,
                    label: "Interview",
                    value: interviewN,
                    color: "#FFB800",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <s.icon size={16} color={s.color} />
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {s.label}
                      </p>
                      <p
                        className="font-bold text-sm"
                        style={{
                          fontFamily: "'Syne',sans-serif",
                          color: s.color,
                        }}
                      >
                        {s.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

        {/* Session grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array(PAGE_SIZE)
              .fill(0)
              .map((_, i) => (
                <SkeletonCard key={i} />
              ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "rgba(0,209,255,0.08)",
                border: "1px solid rgba(0,209,255,0.2)",
              }}
            >
              <BarChart2 size={28} color="rgba(0,209,255,0.5)" />
            </div>
            <p
              className="font-bold text-base mb-1"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              No sessions found
            </p>
            <p
              className="text-sm mb-5"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {filterMode !== "all" || filterRole !== "all"
                ? "Try clearing filters."
                : "Start your first interview to see activity here."}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg,#00D1FF,#7B3FF2)",
                boxShadow: "0 4px 20px rgba(0,209,255,0.25)",
              }}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPage={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;
