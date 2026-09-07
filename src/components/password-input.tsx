"use client";

import { useState } from "react";

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  showLabel,
  hideLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className="input transition-base pr-16"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="transition-base absolute inset-y-0 right-0 flex items-center px-3 text-xs text-[var(--foreground)]/60 hover:text-[var(--accent)]"
        aria-label={visible ? hideLabel : showLabel}
        tabIndex={-1}
      >
        {visible ? hideLabel : showLabel}
      </button>
    </div>
  );
}
