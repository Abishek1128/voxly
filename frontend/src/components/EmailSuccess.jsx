import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const VerifyEmailPage = () => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("Verifying...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setShow(true), 50); }, []);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("Invalid verification link ❌"); return; }
    const verify = async () => {
      try {
        await axios.get(`http://localhost:8000/auth/verify?token=${token}`);
        setStatus("Email verified successfully ✅");
        setTimeout(() => navigate("/dashboard"), 3000);
      } catch (error) {
        setStatus(error.response?.data?.detail || "Verification failed ❌");
      }
    };
    verify();
  }, [navigate, searchParams]);

  const isSuccess = status.includes("successfully");
  const isPending = status === "Verifying...";

  const iconBg    = isPending ? "rgba(123,63,242,0.15)" : isSuccess ? "rgba(0,209,255,0.12)"  : "rgba(255,47,179,0.12)";
  const iconBorder= isPending ? "rgba(123,63,242,0.4)"  : isSuccess ? "rgba(0,209,255,0.4)"   : "rgba(255,47,179,0.4)";
  const iconGlow  = isPending ? "rgba(123,63,242,0.2)"  : isSuccess ? "rgba(0,209,255,0.2)"   : "rgba(255,47,179,0.2)";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: "#04040a" }}>
      <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 500, height: 500, background: "rgba(123,63,242,0.18)", top: -80, right: -100, filter: "blur(90px)" }} />
      <div className="absolute rounded-full animate-orb pointer-events-none" style={{ width: 350, height: 350, background: "rgba(0,209,255,0.12)", bottom: 0, left: -60, filter: "blur(90px)", animationDelay: "5s" }} />
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
          className="w-17 h-17 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ width: 68, height: 68, background: iconBg, border: `1.5px solid ${iconBorder}`, boxShadow: `0 0 28px ${iconGlow}` }}
        >
          {isPending ? (
            <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-[#00D1FF] animate-spin" />
          ) : isSuccess ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00D1FF" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="m7 12 4 4 6-8"/>
            </svg>
          ) : (
            <span className="text-xl text-[#FF2FB3]">✖</span>
          )}
        </div>

        <h2 className="text-xl font-extrabold mb-2.5" style={{ fontFamily: "'Syne', sans-serif" }}>
          {isPending ? "Verifying..." : isSuccess ? "Email Verified!" : "Verification Failed"}
        </h2>
        <p className="text-sm text-white/45 leading-relaxed mb-6">{status}</p>

        {isSuccess && (
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", backgroundSize: "200%", boxShadow: "0 4px 20px rgba(0,209,255,0.3)" }}
          >
            Go to Dashboard →
          </button>
        )}

        <p className="text-xs text-white/25 mt-4">
          {isSuccess ? "You're all set. Enjoy using VOXLY 🎉" : isPending ? "Please wait..." : "Please try again or request a new link."}
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
