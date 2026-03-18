import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, UserCircle, BarChart2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import api from "../api";
// import logo from "../assets/logo8.png";
import logo from "../assets/logo8-bgremove.png"

const Navbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [avatar,    setAvatar]    = useState(null);   // base64 or null
  const menuRef    = useRef(null);
  const closeTimer = useRef(null);   // delay closing so cursor can move to menu

  const openMenu  = () => { clearTimeout(closeTimer.current); setMenuOpen(true), 120;  };
  const closeMenu = () => { closeTimer.current = setTimeout(() => setMenuOpen(false), 120); };
  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";


  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch(err) {
      console.log("Logout Error : ", err)
    }
    logout()
    navigate("/login")
  }

  /* ── scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── fetch avatar once on mount ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("http://127.0.0.1:8000/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setAvatar(res.data.avatar || null))
    .catch(() => {});
  }, []);

  /* ── if profile page fires a custom event after save, refresh avatar ── */
  useEffect(() => {
    const handler = (e) => setAvatar(e.detail?.avatar || null);
    window.addEventListener("voxly:avatar-updated", handler);
    return () => window.removeEventListener("voxly:avatar-updated", handler);
  }, []);



  const navLinks = [
    { to: "/dashboard", label: "Dashboard"      },
    { to: "/interview", label: "Start Interview" },
    { to: "/analytics", label: "Analytics"       },
  ];

  /* ── shared link style ── */
  const linkStyle = ({ isActive }) => ({
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? "#00D1FF" : "rgba(255,255,255,0.5)",
    textDecoration: "none",
    transition: "color 0.2s",
    position: "relative",
    paddingBottom: 2,
  });

  return (
    <>
      {/* Inline hover style — Tailwind can't do :hover on NavLink easily */}
      <style>{`
        .nav-link:hover { color: #00D1FF !important; }
        .nav-link.active-link::after {
          content: "";
          position: absolute;
          bottom: -4px; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00D1FF, #7B3FF2);
          border-radius: 2px;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", transition: "background 0.3s",
        background: scrolled ? "rgba(4,4,10,0.97)" : "rgba(4,4,10,0.72)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Logo */}
        <NavLink to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={logo} alt="VOXLY" className="w-24 h-12 rounded-full" />
        </NavLink>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-link${isActive ? " active-link" : ""}`}
              style={linkStyle}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Avatar dropdown — opens on hover, 120ms close-delay keeps menu reachable */}
        <div ref={menuRef} style={{ position: "relative" }}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          <div
            style={{
              width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
              background: avatar ? "transparent" : menuOpen
                ? "linear-gradient(135deg,#7B3FF2,#00D1FF)"
                : "linear-gradient(135deg,#00D1FF,#7B3FF2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#fff",
              boxShadow: menuOpen ? "0 0 22px rgba(123,63,242,0.6)" : "0 0 14px rgba(0,209,255,0.35)",
              transition: "all 0.2s",
              outline: menuOpen ? "2px solid rgba(0,209,255,0.4)" : "none",
              outlineOffset: 2,
              overflow: "hidden",
              border: "2px solid rgba(0,209,255,0.3)",
            }}
          >
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>

          {menuOpen && (
            <div
              onMouseEnter={openMenu}
              onMouseLeave={closeMenu}
              style={{
              position: "absolute", right: 0, top: "calc(100% + 10px)",
              minWidth: 200,
              background: "#0d0d1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: 8,
              boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
              animation: "fadeUp 0.18s ease",
            }}>

              {/* User info */}
              <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                {/* mini avatar */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
                  {avatar
                    ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || ""}</p>
                </div>
              </div>

              {/* My Profile */}
              <MenuBtn icon={<UserCircle size={15} />} label="My Profile"  onClick={() => { setMenuOpen(false); navigate("/profile"); }} />
              {/* Analytics shortcut */}
              <MenuBtn icon={<BarChart2  size={15} />} label="Analytics"   onClick={() => { setMenuOpen(false); navigate("/analytics"); }} />

              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 8px" }} />

              {/* Sign out */}
              <button
                onClick={handleLogout}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", color: "#FF2FB3", cursor: "pointer", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,47,179,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

/* ── reusable menu button ── */
function MenuBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
    >
      {icon} {label}
    </button>
  );
}

export default Navbar;