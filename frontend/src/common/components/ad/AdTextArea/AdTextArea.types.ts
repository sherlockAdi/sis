import { type ReactNode } from "react";

export interface AdTextAreaProps {
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

  minRows?: number;
  maxRows?: number;

  fullWidth?: boolean;

  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}