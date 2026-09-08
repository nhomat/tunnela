"use client";

import { useId, useState } from "react";

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  showLabel,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  showLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const checkboxId = useId();

  return (
    <div>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        className="input transition-base"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
      />
      <label htmlFor={checkboxId} className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground)]/70">
        <input
          id={checkboxId}
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        {showLabel}
      </label>
    </div>
  );
}
