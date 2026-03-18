import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo8-bgremove.png";

const ForgotPasswordPage = () => {
  const [email, setEmail]         = useState("");
  const [error, setError]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!email) { setError("Email is required."); return false; }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setError("Enter a valid email address."); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      await axios.post("http://127.0.0.1:8000/auth/forgot-password", { email });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "#04040a" }}
    >
      {/* Background orbs */}
      <div className="absolute rounded-full pointer-events-none"
        style={{ width: 500, height: 500, background: "rgba(123,63,242,0.16)", top: -100, right: -100, filter: "blur(90px)" }} />
      <div className="absolute rounded-full pointer-events-none"
        style={{ width: 360, height: 360, background: "rgba(255,184,0,0.08)", bottom: -60, left: -80, filter: "blur(90px)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />

      <div
        className="relative z-10 w-full max-w-md rounded-3xl px-10 py-11"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="VOXLY" className="h-12 w-auto" />
        </div>

        {!submitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                Forgot Password?
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                No worries. Enter your registered email and we'll send you a reset link.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm text-[#FF2FB3]"
                style={{ background: "rgba(255,47,179,0.1)", border: "1px solid rgba(255,47,179,0.3)" }}>
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${error ? "rgba(255,47,179,0.6)" : "rgba(255,255,255,0.1)"}`,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(0,209,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = error ? "rgba(255,47,179,0.6)" : "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}
              >
                {loading
                  ? <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-4">
            <div className="text-5xl mb-5">📬</div>
            <h2 className="text-2xl font-extrabold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
              Check your inbox
            </h2>
            <p className="text-sm text-white/45 leading-relaxed mb-2">
              If <span className="text-[#00D1FF] font-medium">{email}</span> is registered,
              we've sent a password reset link.
            </p>
            <p className="text-xs text-white/25 mb-8">
              The link expires in 15 minutes. Check your spam folder if you don't see it.
            </p>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-8 text-sm"
              style={{ background: "rgba(0,209,255,0.05)", border: "1px solid rgba(0,209,255,0.18)" }}>
              <span className="text-[#00D1FF] text-base">💡</span>
              <p className="text-white/40 text-xs leading-relaxed text-left">
                Didn't receive it? Wait a moment and check your spam folder, or go back and try again.
              </p>
            </div>
          </div>
        )}

        {/* Back to sign in */}
        <p className="text-center text-xs text-white/35 mt-4">
          Remember your password?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-[#00D1FF] cursor-pointer hover:underline">
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;