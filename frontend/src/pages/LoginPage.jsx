import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo8-bgremove.png";
import api from "../api";
// import logo from "../assets/final-logo.png";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerErrors] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const validate = () => {
    let e = {};
    if (!formData.email) e.email = "Email is required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))
      e.email = "Invalid email address";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  setLoading(true);
  setServerErrors("");

  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/auth/login",
      formData
    );

    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;

    // store tokens
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);

    // get user info
    const user = {
      email: formData.email
    };

    // save user properly
    localStorage.setItem("user", JSON.stringify(user));

    // update auth context
    login({
      access_token: accessToken,
      refresh_token: refreshToken,
      user
    });

    navigate("/dashboard");

  } catch (error) {

    if (error.response) {
      const s = error.response.status;

      if (s === 403)
        setServerErrors("Your email is not verified. Please check your inbox.");
      else if (s === 400)
        setServerErrors("Invalid email or password.");
      else
        setServerErrors("Something went wrong.");
    } else {
      setServerErrors("Server not responding.");
    }

  } finally {
    setLoading(false);
  }
};

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "#04040a" }}
    >
      <div
        className="absolute rounded-full animate-orb pointer-events-none"
        style={{
          width: 550,
          height: 550,
          background: "rgba(123,63,242,0.18)",
          top: -100,
          right: -120,
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute rounded-full animate-orb pointer-events-none"
        style={{
          width: 380,
          height: 380,
          background: "rgba(0,209,255,0.12)",
          bottom: 0,
          left: -80,
          filter: "blur(90px)",
          animationDelay: "5s",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div
        className="relative z-10 w-full max-w-md rounded-3xl px-10 py-11 animate-fade-up"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          {/* <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white mx-auto mb-5"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #00D1FF, #7B3FF2)",
              boxShadow: "0 0 24px rgba(0,209,255,0.4)",
            }}
          >
            V
          </div> */}
          <div className="flex flex-col items-center justify-center">
            <img src={logo} alt="" className="w-32 h-16 rounded-full mb-5"/>
          </div>
          {/* <div className="flex flex-col items-center justify-center">
            <img src={logo} alt="" className="w-32 h-32 rounded-full"/>
          </div> */}
          <h2
            className="text-2xl font-extrabold mb-2"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Sign In to VOXLY
          </h2>
          <p className="text-sm text-white/40">
            Enter your credentials to access your account.
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm text-[#FF2FB3]"
            style={{
              background: "rgba(255,47,179,0.1)",
              border: "1px solid rgba(255,47,179,0.35)",
            }}
          >
            <span className="text-base">⚠</span> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Email ID
            </label>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${errors.email ? "rgba(255,47,179,0.6)" : "rgba(255,255,255,0.1)"}`,
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.email
                  ? "rgba(255,47,179,0.7)"
                  : "rgba(0,209,255,0.55)";
                e.target.style.boxShadow = `0 0 0 3px ${errors.email ? "rgba(255,47,179,0.12)" : "rgba(0,209,255,0.1)"}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email
                  ? "rgba(255,47,179,0.6)"
                  : "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
            {errors.email && (
              <p className="text-xs text-[#FF2FB3] mt-1.5">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${errors.password ? "rgba(255,47,179,0.6)" : "rgba(255,255,255,0.1)"}`,
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(0,209,255,0.55)";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password
                  ? "rgba(255,47,179,0.6)"
                  : "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
            {errors.password && (
              <p className="text-xs text-[#FF2FB3] mt-1.5">{errors.password}</p>
            )}
            <div className="text-right mt-1.5">
              <button
                onClick={() => navigate("/forgot-password")}
                type="button"
                className="text-xs text-[#00D1FF] bg-transparent border-none cursor-pointer hover:underline"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-1 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #00D1FF, #7B3FF2)",
              backgroundSize: "200%",
              boxShadow: "0 4px 20px rgba(0,209,255,0.25)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/35 mt-6">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-[#00D1FF] cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
