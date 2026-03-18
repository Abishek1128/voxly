import { useEffect, useState } from "react";

const EmailReady = () => {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 50); }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: "#04040a" }}>
      {/* Orbs */}
      <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 500, height: 500, background: "rgba(123,63,242,0.18)", top: -80, right: -100, filter: "blur(90px)" }} />
      <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 350, height: 350, background: "rgba(0,209,255,0.12)", bottom: 0, left: -60, filter: "blur(90px)", animationDelay: "4s" }} />
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-11 text-center transition-all duration-700"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(0,209,255,0.12)", border: "1.5px solid rgba(0,209,255,0.35)", boxShadow: "0 0 28px rgba(0,209,255,0.2)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00D1FF" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m2 7 10 7 10-7"/>
          </svg>
        </div>

        <h2 className="text-xl font-extrabold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>You're Ready to Go!</h2>
        <p className="text-sm text-white/45 leading-relaxed mb-7">
          Check your email to begin.<br />
          Open your inbox and click the activation link to complete your sign up.
        </p>

        <a
          href="https://mail.google.com" target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-white/70 no-underline transition-all duration-200 hover:text-white mb-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,209,255,0.4)"; e.currentTarget.style.background = "rgba(0,209,255,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="gmail" />
          Open Gmail
        </a>

        <p className="text-xs text-white/30">
          Didn't receive it?{" "}
          <button className="text-[#00D1FF] bg-transparent border-none cursor-pointer text-xs hover:underline" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Resend code
          </button>
        </p>
      </div>
    </div>
  );
};

export default EmailReady;
