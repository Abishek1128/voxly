import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo8-bgremove.png";

const ResetPasswordPage = () => {
  const [searchParams]                      = useSearchParams();
  const token                               = searchParams.get("token");
  const navigate                            = useNavigate();

  const [form, setForm]                     = useState({ new_password: "", confirm_password: "" });
  const [errors, setErrors]                 = useState({});
  const [serverError, setServerError]       = useState("");
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  // Redirect if no token in URL
  useEffect(() => {
    if (!token) navigate("/forgot-password");
  }, [token, navigate]);

  const validate = () => {
    let e = {};
    if (!form.new_password)              e.new_password = "Password is required.";
    else if (form.new_password.length < 6) e.new_password = "Password must be at least 6 characters.";
    if (!form.confirm_password)          e.confirm_password = "Please confirm your password.";
    else if (form.new_password !== form.confirm_password)
                                         e.confirm_password = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/auth/reset-password", {
        token,
        new_password:     form.new_password,
        confirm_password: form.confirm_password,
      });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 400)
        setServerError(err.response.data.detail || "Invalid or expired reset link.");
      else
        setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = (pwd) => {
    if (!pwd) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: "Weak",   color: "#FF2FB3", width: "25%" };
    if (score <= 3) return { label: "Fair",   color: "#FFB800", width: "55%" };
    if (score <= 4) return { label: "Good",   color: "#00D1FF", width: "75%" };
    return              { label: "Strong", color: "#22c55e", width: "100%" };
  };

  const pwdStrength = strength(form.new_password);

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200`;

  const inputStyle = (field) => ({
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${errors[field] ? "rgba(255,47,179,0.6)" : "rgba(255,255,255,0.1)"}`,
    fontFamily: "'DM Sans', sans-serif",
  });

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

        {!success ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🔑</div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                Set New Password
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                Choose a strong password for your VOXLY account.
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm text-[#FF2FB3]"
                style={{ background: "rgba(255,47,179,0.1)", border: "1px solid rgba(255,47,179,0.3)" }}>
                <span>⚠</span> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    name="new_password"
                    placeholder="••••••••"
                    value={form.new_password}
                    onChange={handleChange}
                    className={inputClass("new_password")}
                    style={{ ...inputStyle("new_password"), paddingRight: "44px" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(0,209,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)"; }}
                    onBlur={e  => { e.target.style.borderColor = errors.new_password ? "rgba(255,47,179,0.6)" : "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-xs"
                  >
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Strength bar */}
                {form.new_password && (
                  <div className="mt-2">
                    <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: pwdStrength.width, background: pwdStrength.color }}
                      />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: pwdStrength.color }}>
                      {pwdStrength.label}
                    </p>
                  </div>
                )}
                {errors.new_password && <p className="text-xs text-[#FF2FB3] mt-1.5">{errors.new_password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirm_password"
                    placeholder="••••••••"
                    value={form.confirm_password}
                    onChange={handleChange}
                    className={inputClass("confirm_password")}
                    style={{ ...inputStyle("confirm_password"), paddingRight: "44px" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(0,209,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)"; }}
                    onBlur={e  => { e.target.style.borderColor = errors.confirm_password ? "rgba(255,47,179,0.6)" : "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-xs"
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Match indicator */}
                {form.confirm_password && (
                  <p className={`text-[10px] mt-1.5 ${form.new_password === form.confirm_password ? "text-green-400" : "text-[#FF2FB3]"}`}>
                    {form.new_password === form.confirm_password ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
                {errors.confirm_password && <p className="text-xs text-[#FF2FB3] mt-1">{errors.confirm_password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-1 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}
              >
                {loading
                  ? <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  : "Reset Password"}
              </button>
            </form>
          </>
        ) : (
          /* Success */
          <div className="text-center py-4">
            <div className="text-5xl mb-5">✅</div>
            <h2 className="text-2xl font-extrabold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
              Password Reset!
            </h2>
            <p className="text-sm text-white/45 leading-relaxed mb-8">
              Your password has been updated successfully.
              You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;