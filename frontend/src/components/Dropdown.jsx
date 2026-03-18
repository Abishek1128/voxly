import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const ModernDropdown = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-xs text-white/50 mb-1.5 font-medium tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all duration-200"
        style={{
          background: isOpen ? "rgba(0,209,255,0.06)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isOpen ? "rgba(0,209,255,0.5)" : "rgba(255,255,255,0.1)"}`,
          color: value ? "#fff" : "rgba(255,255,255,0.28)",
          boxShadow: isOpen ? "0 0 0 3px rgba(0,209,255,0.1)" : "none",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span className={value ? "font-medium" : "font-normal"}>{selectedLabel || placeholder}</span>
        <ChevronDown
          size={15}
          style={{
            color: isOpen ? "#00D1FF" : "rgba(255,255,255,0.4)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s, color 0.2s",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1.5 rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}
        >
          <ul className="max-h-56 overflow-y-auto p-1 m-0 list-none">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-150"
                style={{
                  background: value === option.value ? "rgba(0,209,255,0.1)" : "transparent",
                  color: value === option.value ? "#00D1FF" : "rgba(255,255,255,0.65)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: value === option.value ? 600 : 400,
                }}
                onMouseEnter={e => { if (value !== option.value) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (value !== option.value) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; } }}
              >
                {option.label}
                {value === option.value && <Check size={13} color="#00D1FF" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModernDropdown;
