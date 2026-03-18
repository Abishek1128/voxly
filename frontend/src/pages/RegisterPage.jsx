import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo8-bgremove.png";
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerErrors] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    let e = {};
    if (!formData.name) e.name = "Name is required";
    else if (formData.name.length < 3)
      e.name = "Name must be at least 3 characters";
    else if (!/^[A-Za-z\s]+$/.test(formData.name))
      e.name = "Name can only contain letters";
    if (!formData.email) e.email = "Email is required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))
      e.email = "Invalid email address";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/auth/register", formData);
      navigate("/check-email");
    } catch (error) {
      const message = error.response?.data?.detail;

      if (message === "Email already registered") {
        setErrors((prev) => ({
          ...prev,
          email: "Email already registered",
        }));
      } else {
        setServerErrors(message || "Something went wrong");
      }
    }
  };

  const passChecks = [
    { ok: formData.password.length >= 6, label: "At least 6 characters" },
    { ok: /[A-Z]/.test(formData.password), label: "One uppercase letter" },
    { ok: /[0-9]/.test(formData.password), label: "One number" },
  ];

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
      <div
        className="absolute rounded-full animate-orb pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: "rgba(123,63,242,0.18)",
          top: -80,
          right: -100,
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute rounded-full animate-orb pointer-events-none"
        style={{
          width: 350,
          height: 350,
          background: "rgba(0,209,255,0.12)",
          bottom: 0,
          left: -60,
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
          {/* <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white mx-auto mb-5"
            style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", boxShadow: "0 0 24px rgba(0,209,255,0.4)" }}>V</div> */}
          <div className="flex flex-col items-center justify-center">
            <img src={logo} alt="" className="w-32 h-16 rounded-full mb-5" />
          </div>
          <h2
            className="text-2xl font-extrabold mb-2"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Create Your Account
          </h2>
          <p className="text-sm text-white/40">
            Start your journey to interview success
          </p>
        </div>

        {serverError && (
          <div
            className="px-4 py-3 rounded-xl mb-5 text-sm text-[#FF2FB3]"
            style={{
              background: "rgba(255,47,179,0.1)",
              border: "1px solid rgba(255,47,179,0.35)",
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            {
              name: "name",
              type: "text",
              label: "Full Name",
              placeholder: "Enter your name",
            },
            {
              name: "email",
              type: "email",
              label: "Email ID",
              placeholder: "your.email@example.com",
            },
            {
              name: "password",
              type: "password",
              label: "Password",
              placeholder: "Create a strong password",
            },
          ].map(({ name, type, label, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                {label}
              </label>
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={formData[name]}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
                style={inputStyle(name)}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0,209,255,0.55)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors[name]
                    ? "rgba(255,47,179,0.6)"
                    : "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {errors[name] && (
                <p className="text-xs text-[#FF2FB3] mt-1.5">{errors[name]}</p>
              )}
              {/* Password strength indicators */}
              {name === "password" && formData.password && (
                <div className="flex flex-col gap-1.5 mt-2.5">
                  {passChecks.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs transition-colors duration-200"
                      style={{
                        color: c.ok ? "#00D1FF" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] transition-all duration-200"
                        style={{
                          background: c.ok
                            ? "rgba(0,209,255,0.15)"
                            : "rgba(255,255,255,0.05)",
                          border: `1px solid ${c.ok ? "#00D1FF" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        {c.ok ? "✓" : ""}
                      </div>
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

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
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Sending Verification Email...</span>
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/35 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-[#00D1FF] cursor-pointer hover:underline"
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
