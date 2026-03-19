import { type ReactNode } from "react";

export type AdTextBoxType = "text" | "password" | "email" | "number";

export interface AdTextBoxProps {
  label?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: AdTextBoxType;

  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;

  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;

  helperText?: string;
  error?: string;

  clearable?: boolean;
  showPasswordToggle?: boolean;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;

  size?: "small" | "medium";
  variant?: "outlined" | "filled" | "standard";
  fullWidth?: boolean;

  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onEnter?: () => void;
}
