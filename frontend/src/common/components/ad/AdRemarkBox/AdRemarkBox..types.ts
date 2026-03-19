import {type ReactNode } from "react";

export interface AdRemarkBoxProps {
  label?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;

  required?: boolean;
  minLength?: number;
  maxLength?: number;

  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;

  helperText?: string;
  error?: string;

  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;

  rows?: number;
  minRows?: number;
  maxRows?: number;

  size?: "small" | "medium";
  variant?: "outlined" | "filled" | "standard";
  fullWidth?: boolean;

  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}