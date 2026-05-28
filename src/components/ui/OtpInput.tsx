"use client";
import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (otp: string[]) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input if mounted and empty
    if (!disabled && refs.current[0]) {
      refs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, val: string) => {
    // Only allow digits
    const digit = val.replace(/\D/g, "").slice(-1);
    const newValue = [...value];
    newValue[index] = digit;
    onChange(newValue);

    // Auto-focus next input
    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        const newValue = [...value];
        newValue[index - 1] = "";
        onChange(newValue);
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newValue = [...value];
      for (let i = 0; i < 6; i++) {
        newValue[i] = pastedData[i] || "";
      }
      onChange(newValue);
      // Focus the next empty input or the last one
      const nextEmpty = newValue.findIndex((d) => d === "");
      refs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all duration-300 bg-[#f0f4fd] text-[#0d153a] ${
            digit
              ? "border-[#3B5C37] bg-white shadow-[0_4px_16px_rgba(59, 92, 55,0.12)] scale-105"
              : "border-[#e1e4ed]/60 hover:border-[#3B5C37]/40"
          } focus:border-[#3B5C37] focus:bg-white focus:ring-4 focus:ring-[#3B5C37]/10 focus:scale-105 ${
            disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
          }`}
        />
      ))}
    </div>
  );
}
export default OtpInput;
