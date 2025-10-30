import React from "react";
import "./Button.css";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  fullWidth = false,
  disabled = false,
}) {
  const className = [
    "cf-btn",
    `cf-btn--${variant}`,
    fullWidth ? "cf-btn--block" : "",
  ].join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
}