import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Mail, User, Lock, Bell, Shield, LogOut,
  CheckCircle, Edit3, Trash2, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

/* ─── style tokens ──────────────────────────────────────── */
const S = {
  page: { minHeight: "100vh", background: "#04040a", position: "relative", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" },
  orb: (w, h, bg, t, r, b, l, d) => ({ position: "absolute", width: w, height: h, background: bg, borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", top: t, right: r, bottom: b, left: l }),
  grid: { position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "56px 56px" },
  inner: { position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "82px 48px 60px" },
  card: (border) => ({ background: "rgba(255,255,255,0.03)", border: `1px solid ${border || "rgba(255,255,255,0.07)"}`, backdropFilter: "blur(20px)", borderRadius: 20 }),
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginBottom: 7, letterSpacing: "0.03em" },
  input: (disabled) => ({ width: "100%", padding: "12px 16px", borderRadius: 12, background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"}`, color: disabled ? "rgba(255,255,255,0.4)" : "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box", cursor: disabled ? "not-allowed" : "text" }),
  btnPrimary: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", border: "none", color: "#fff", fontWeight: 600, borderRadius: 12, padding: "11px 26px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(0,209,255,0.25)", transition: "all 0.2s" },
  btnGhost: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontWeight: 500, borderRadius: 12, padding: "11px 22px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" },
  btnDanger: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,47,179,0.08)", border: "1px solid rgba(255,47,179,0.3)", color: "#FF2FB3", fontWeight: 600, borderRadius: 12, padding: "11px 22px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" },
};

/* ─── activity helpers ──────────────────────────────────── */
const ROLE_LABELS = { frontend: "Front-end Developer", python_backend: "Python Developer", java_backend: "Java Developer" };
const ROLE_COLORS = { frontend: "#00D1FF", python_backend: "#FFB800", java_backend: "#FF2FB3" };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000), weeks = Math.floor(days / 7);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}
function formatActivityScore(s) {
  if (s.average_score != null && s.average_score > 0) return `${s.average_score.toFixed(1)}/10`;
  if (s.verdict) return s.verdict;
  return "—";
}

/* ─── password input with toggle ────────────────────────── */
function PwInput({ label, value, onChange, placeholder = "••••••••" }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={S.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"} value={value} onChange={onChange}
          placeholder={placeholder}
          style={{ ...S.input(false), paddingRight: 44 }}
          onFocus={e  => { e.target.style.borderColor = "rgba(0,209,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)"; }}
          onBlur={e   => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
        />
        <button type="button" onClick={() => setShow(v => !v)}
          style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 0 }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const token            = localStorage.getItem("token");
  const avatarInputRef   = useRef(null);

  /* ── ui state ── */
  const [editMode,  setEditMode]  = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [notifs,    setNotifs]    = useState({ email: true, tips: true, reports: false });

  /* ── form ── */
  const [form, setForm] = useState({ name: "", email: "", bio: "", role: "", location: "" });
  const [avatar, setAvatar] = useState(null); // base64 data-url or null

  /* ── stats ── */
  const [stats, setStats] = useState(null);

  /* ── security ── */
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  /* ── delete account ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword,  setDeletePassword]  = useState("");
  const [deleteError,     setDeleteError]     = useState("");
  const [deleteLoading,   setDeleteLoading]   = useState(false);

  /* ── activity ── */
  const [activityLog,     setActivityLog]     = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage,    setActivityPage]    = useState(1);
  const [activityHasMore, setActivityHasMore] = useState(true);
  const ACTIVITY_LIMIT = 5;

  /* ── fetch profile + stats on mount ── */
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get("http://127.0.0.1:8000/auth/me", { headers })
      .then(res => {
        setForm({ name: res.data.name || "", email: res.data.email || "", bio: res.data.bio || "", role: res.data.role || "", location: res.data.location || "" });
        setAvatar(res.data.avatar || null);
      })
      .catch(() => setForm(f => ({ ...f, name: user?.name || "", email: user?.email || "" })));

    axios.get("http://127.0.0.1:8000/auth/stats", { headers })
      .then(res => setStats(res.data))
      .catch(() => {});
  }, [token]);

  /* ── avatar upload ── */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result); // base64 data-url
    reader.readAsDataURL(file);
  };

  /* ── save profile ── */
  const handleSave = async () => {
    setSaveError(""); setSaving(true);
    try {
      await axios.put(
        "http://127.0.0.1:8000/auth/me",
        { name: form.name, bio: form.bio, role: form.role, location: form.location, avatar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaved(true); setEditMode(false);
      // notify Navbar to refresh avatar immediately
      window.dispatchEvent(new CustomEvent("voxly:avatar-updated", { detail: { avatar } }));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.detail || "Failed to save. Try again.");
    } finally { setSaving(false); }
  };

  /* ── change password ── */
  const handlePasswordChange = async () => {
    setPwError(""); setPwSuccess(false);
    if (!passwords.current)                      { setPwError("Enter your current password."); return; }
    if (passwords.newPass.length < 6)            { setPwError("New password must be at least 6 characters."); return; }
    if (passwords.newPass !== passwords.confirm) { setPwError("Passwords don't match."); return; }
    setPwLoading(true);
    try {
      await axios.put(
        "http://127.0.0.1:8000/auth/password",
        { current_password: passwords.current, new_password: passwords.newPass },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwSuccess(true);
      setPasswords({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err) {
      setPwError(err.response?.data?.detail || "Failed to update password.");
    } finally { setPwLoading(false); }
  };

  /* ── delete account ── */
  const handleDeleteAccount = async () => {
    setDeleteError(""); setDeleteLoading(true);
    try {
      await axios.delete("http://127.0.0.1:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword },
      });
      logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err.response?.data?.detail || "Failed to delete account.");
    } finally { setDeleteLoading(false); }
  };

  /* ── activity ── */
  useEffect(() => {
    if (activeTab !== "activity") return;
    setActivityLog([]); setActivityPage(1); setActivityHasMore(true);
    fetchActivity(1, true);
  }, [activeTab]);

  const fetchActivity = async (page, reset = false) => {
    setActivityLoading(true);
    try {
      const res  = await axios.get(
        `http://127.0.0.1:8000/interview/sessions?page=${page}&limit=${ACTIVITY_LIMIT}&sort=newest`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list  = res.data.sessions ?? (Array.isArray(res.data) ? res.data : []);
      const total = res.data.total    ?? list.length;
      setActivityLog(prev => reset ? list : [...prev, ...list]);
      setActivityPage(page);
      setActivityHasMore((page * ACTIVITY_LIMIT) < total);
    } catch (err) { console.error(err); }
    finally { setActivityLoading(false); }
  };

  /* ── computed ── */
  const initials = form.name ? form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  const LIVE_STATS = stats ? [
    { label: "Interviews Done",   value: stats.interview_sessions,           color: "#00D1FF" },
    { label: "Avg. Score",        value: `${stats.average_score_pct}%`,      color: "#7B3FF2" },
    { label: "Best Score",        value: `${stats.best_score_pct}%`,         color: "#FFB800" },
    { label: "Practice Sessions", value: stats.practice_sessions,            color: "#FF2FB3" },
  ] : [
    { label: "Interviews Done",   value: "—", color: "#00D1FF" },
    { label: "Avg. Score",        value: "—", color: "#7B3FF2" },
    { label: "Best Score",        value: "—", color: "#FFB800" },
    { label: "Practice Sessions", value: "—", color: "#FF2FB3" },
  ];

  const tabs = [
    { id: "profile",  icon: <User size={15} />,   label: "Profile"       },
    { id: "security", icon: <Lock size={15} />,   label: "Security"      },
    { id: "notifs",   icon: <Bell size={15} />,   label: "Notifications" },
    { id: "activity", icon: <Shield size={15} />, label: "Activity"      },
  ];

  return (
    <div style={S.page}>
      {/* hidden avatar file input */}
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />

      <div style={S.orb(500, 500, "rgba(123,63,242,0.12)", -80, -100, "auto", "auto")} />
      <div style={S.orb(400, 400, "rgba(0,209,255,0.08)", "auto", "auto", -60, -60)} />
      <div style={S.grid} />
      <Navbar />

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div style={{ ...S.card("rgba(255,47,179,0.25)"), padding: 32, maxWidth: 420, width: "90%", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,47,179,0.12)", border: "1px solid rgba(255,47,179,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={20} color="#FF2FB3" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, margin: 0, color: "#FF2FB3" }}>Delete Account</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>This action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20, lineHeight: 1.6 }}>
              All your sessions, responses, and data will be permanently deleted. Enter your password to confirm.
            </p>
            <PwInput label="Confirm Password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter your password" />
            {deleteError && <p style={{ color: "#FF2FB3", fontSize: 13, marginTop: 10 }}>⚠ {deleteError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }}>Cancel</button>
              <button
                style={{ ...S.btnDanger, flex: 1, opacity: deleteLoading ? 0.6 : 1 }}
                onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? "Deleting…" : <><Trash2 size={14} /> Delete Forever</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={S.inner}>

        {/* ── Top banner ── */}
        <div style={{ ...S.card(), marginBottom: 24, overflow: "hidden" }}>
          <div style={{ height: 110, background: "linear-gradient(135deg, rgba(0,209,255,0.15), rgba(123,63,242,0.25), rgba(255,47,179,0.1))", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
          </div>

          <div style={{ padding: "0 32px 28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginTop: -44 }}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: avatar ? "transparent" : "linear-gradient(135deg,#00D1FF,#7B3FF2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 30, color: "#fff", border: "3px solid #04040a", boxShadow: "0 0 28px rgba(0,209,255,0.4)", overflow: "hidden" }}>
                  {avatar
                    ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials
                  }
                </div>
                {/* Camera button — always visible, triggers file picker */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                  title="Change photo"
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,209,255,0.2)"; e.currentTarget.style.borderColor = "rgba(0,209,255,0.6)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#0d0d1a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}>
                  <Camera size={12} color="rgba(255,255,255,0.8)" />
                </button>
              </div>
              <div style={{ paddingBottom: 4 }}>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>
                  {form.name || <span style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</span>}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
                  {form.role || "No role set"} · {form.location || "No location set"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 4, flexWrap: "wrap" }}>
              {saved && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, background: "rgba(0,209,255,0.1)", border: "1px solid rgba(0,209,255,0.35)", color: "#00D1FF", fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle size={14} /> Saved!
                </div>
              )}
              {saveError && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, background: "rgba(255,47,179,0.08)", border: "1px solid rgba(255,47,179,0.3)", color: "#FF2FB3", fontSize: 13, fontWeight: 600 }}>
                  ⚠ {saveError}
                </div>
              )}
              {editMode ? (
                <>
                  <button style={{ ...S.btnGhost, fontSize: 13 }} onClick={() => { setEditMode(false); setSaveError(""); }}>Cancel</button>
                  <button style={{ ...S.btnPrimary, fontSize: 13, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </>
              ) : (
                <button style={{ ...S.btnGhost, fontSize: 13 }} onClick={() => setEditMode(true)}>
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* ── Real stats strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {LIVE_STATS.map((s, i) => (
              <div key={i} style={{ padding: "18px 24px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", position: "relative" }}>
                {!stats && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 40, height: 14, borderRadius: 6, background: "rgba(255,255,255,0.07)", animation: "pulse 1.5s ease-in-out infinite" }} />
                  </div>
                )}
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: s.color, margin: "0 0 4px", opacity: stats ? 1 : 0, transition: "opacity 0.4s" }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs + Content ── */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, transition: "all 0.15s", textAlign: "left",
                  background: activeTab === t.id ? "linear-gradient(135deg,rgba(0,209,255,0.12),rgba(123,63,242,0.12))" : "rgba(255,255,255,0.03)",
                  color:      activeTab === t.id ? "#00D1FF" : "rgba(255,255,255,0.5)",
                  border:     `1px solid ${activeTab === t.id ? "rgba(0,209,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}
                onMouseEnter={e => { if (activeTab !== t.id) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}}
                onMouseLeave={e => { if (activeTab !== t.id) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}}
              >{t.icon} {t.label}</button>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
            <button onClick={() => { logout(); navigate("/login"); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,47,179,0.2)", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, background: "rgba(255,47,179,0.05)", color: "#FF2FB3", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,47,179,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,47,179,0.05)"}
            ><LogOut size={15} /> Sign Out</button>
          </div>

          {/* ── Tab content ── */}
          <div>

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <div style={{ ...S.card(), padding: 28 }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, margin: "0 0 22px", display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} color="#00D1FF" /> Personal Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                  {[
                    { label: "Full Name", key: "name",     type: "text",  alwaysDisabled: false },
                    { label: "Email",     key: "email",    type: "email", alwaysDisabled: true  },
                    { label: "Job Role",  key: "role",     type: "text",  alwaysDisabled: false },
                    { label: "Location",  key: "location", type: "text",  alwaysDisabled: false },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={S.label}>{f.label}</label>
                      <input type={f.type} value={form[f.key]} disabled={f.alwaysDisabled || !editMode}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        style={S.input(f.alwaysDisabled || !editMode)}
                        onFocus={e => { if (editMode && !f.alwaysDisabled) { e.target.style.borderColor = "rgba(0,209,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)"; }}}
                        onBlur={e  => { e.target.style.borderColor = (editMode && !f.alwaysDisabled) ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={S.label}>Bio</label>
                  <textarea rows={3} value={form.bio} disabled={!editMode}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    style={{ ...S.input(!editMode), resize: "none", lineHeight: 1.65 }}
                    onFocus={e => { if (editMode) { e.target.style.borderColor = "rgba(0,209,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)"; }}}
                    onBlur={e  => { e.target.style.borderColor = editMode ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
                {editMode && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                    <button style={S.btnGhost} onClick={() => { setEditMode(false); setSaveError(""); }}>Cancel</button>
                    <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <div style={{ ...S.card(), padding: 28 }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, margin: "0 0 22px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Lock size={16} color="#00D1FF" /> Change Password
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 440 }}>
                  <PwInput label="Current Password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
                  <PwInput label="New Password"     value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} />
                  <PwInput label="Confirm Password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />

                  {pwError   && <p style={{ color: "#FF2FB3", fontSize: 13, margin: 0 }}>⚠ {pwError}</p>}
                  {pwSuccess && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#00D1FF", fontSize: 13, padding: "10px 14px", background: "rgba(0,209,255,0.08)", border: "1px solid rgba(0,209,255,0.25)", borderRadius: 10 }}>
                      <CheckCircle size={15} /> Password updated successfully!
                    </div>
                  )}

                  {/* Password strength hints */}
                  {passwords.newPass && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        { label: "6+ chars",     ok: passwords.newPass.length >= 6         },
                        { label: "Uppercase",     ok: /[A-Z]/.test(passwords.newPass)       },
                        { label: "Number",        ok: /\d/.test(passwords.newPass)          },
                        { label: "Special char",  ok: /[^a-zA-Z0-9]/.test(passwords.newPass) },
                      ].map((h, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: h.ok ? "rgba(0,209,255,0.12)" : "rgba(255,255,255,0.05)", color: h.ok ? "#00D1FF" : "rgba(255,255,255,0.3)", border: `1px solid ${h.ok ? "rgba(0,209,255,0.3)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.2s" }}>
                          {h.ok ? "✓" : "○"} {h.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <button style={{ ...S.btnPrimary, alignSelf: "flex-start", marginTop: 4, opacity: pwLoading ? 0.7 : 1 }} onClick={handlePasswordChange} disabled={pwLoading}>
                    {pwLoading ? "Updating…" : "Update Password"}
                  </button>
                </div>

                {/* Danger Zone */}
                <div style={{ marginTop: 36, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <h4 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, margin: "0 0 6px", color: "#FF2FB3" }}>Danger Zone</h4>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                  <button style={S.btnDanger} onClick={() => setShowDeleteModal(true)}>
                    <Trash2 size={14} /> Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifs" && (
              <div style={{ ...S.card(), padding: 28 }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, margin: "0 0 22px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={16} color="#00D1FF" /> Notification Preferences
                </h3>
                {[
                  { key: "email",   title: "Email Notifications",   desc: "Receive session summaries and report links via email." },
                  { key: "tips",    title: "Daily Practice Tips",    desc: "Get a daily tip to sharpen your interview skills." },
                  { key: "reports", title: "Weekly Progress Report", desc: "A weekly digest of your improvement across sessions." },
                ].map(n => (
                  <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 3px" }}>{n.title}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: 0 }}>{n.desc}</p>
                    </div>
                    <div onClick={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}
                      style={{ width: 46, height: 26, borderRadius: 13, cursor: "pointer", position: "relative", transition: "background 0.25s", background: notifs[n.key] ? "linear-gradient(135deg,#00D1FF,#7B3FF2)" : "rgba(255,255,255,0.1)", flexShrink: 0, boxShadow: notifs[n.key] ? "0 0 12px rgba(0,209,255,0.35)" : "none" }}>
                      <div style={{ position: "absolute", top: 3, left: notifs[n.key] ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ACTIVITY TAB ── */}
            {activeTab === "activity" && (
              <div style={{ ...S.card(), padding: 28 }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, margin: "0 0 22px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={16} color="#00D1FF" /> Interview History
                </h3>

                {activityLoading && activityLog.length === 0 && [1, 2, 3].map(i => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <div style={{ height: 13, width: 150, borderRadius: 6, background: "rgba(255,255,255,0.07)" }} />
                        <div style={{ height: 10, width: 70, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      <div style={{ height: 14, width: 55, borderRadius: 6, background: "rgba(255,255,255,0.07)" }} />
                      <div style={{ height: 10, width: 50, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
                    </div>
                  </div>
                ))}

                {!activityLoading && activityLog.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>No sessions yet.</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>Start your first interview above!</p>
                  </div>
                )}

                {activityLog.map((session, i) => {
                  const color = ROLE_COLORS[session.role] ?? "#00D1FF";
                  return (
                    <div key={session.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: i < activityLog.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer" }}
                      onClick={() => navigate(`/report/${session.id}`)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          {session.mode === "practice" ? "🎯" : "🏆"}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 3px" }}>{ROLE_LABELS[session.role] ?? session.role}</p>
                          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                            {session.mode === "practice" ? "Practice" : "Interview"}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color, margin: "0 0 2px" }}>{formatActivityScore(session)}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>{session.created_at ? timeAgo(session.created_at) : "—"}</p>
                      </div>
                    </div>
                  );
                })}

                <button
                  style={{ ...S.btnGhost, width: "100%", marginTop: 16, fontSize: 13, justifyContent: "center", opacity: !activityHasMore && !activityLoading ? 0.4 : 1, cursor: activityHasMore ? "pointer" : "default" }}
                  onClick={() => { if (activityHasMore && !activityLoading) fetchActivity(activityPage + 1); }}
                  onMouseEnter={e => { if (activityHasMore) { e.currentTarget.style.borderColor = "rgba(0,209,255,0.4)"; e.currentTarget.style.background = "rgba(0,209,255,0.06)"; }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                >
                  {activityLoading ? "Loading…" : activityHasMore ? "Load More History" : "All sessions loaded"}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;