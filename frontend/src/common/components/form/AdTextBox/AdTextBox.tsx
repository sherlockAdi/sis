import { useEffect, useMemo, useState } from "react";
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { type AdTextBoxProps } from "./AdTextBox.types";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function runValidation(props: AdTextBoxProps, val: string) {
  const { required, minLength, maxLength, pattern, type } = props;

  if (required && !val) return "This field is required";
  if (minLength && val.length < minLength) return `Minimum ${minLength} characters required`;
  if (maxLength && val.length > maxLength) return `Maximum ${maxLength} characters allowed`;
  if (pattern && val && !pattern.test(val)) return "Invalid format";
  if (type === "email" && val && !emailRegex.test(val)) return "Invalid email address";
  if (type === "number" && val && Number.isNaN(Number(val))) return "Must be a number";
  return "";
}

function normalizeNumberInput(val: string) {
  return val.replace(/-/g, "");
}

function clampNumberInput(val: string, min?: number, max?: number) {
  if (!val.trim()) return val;
  const num = Number(val);
  if (!Number.isFinite(num)) return val;
  let next = num;
  if (typeof min === "number" && next < min) next = min;
  if (typeof max === "number" && next > max) next = max;
  return String(next);
}

function readNumericBound(bound: unknown): number | undefined {
  if (typeof bound === "number" && Number.isFinite(bound)) return bound;
  if (typeof bound === "string" && bound.trim()) {
    const parsed = Number(bound);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export default function AdTextBox({
  label,
  name,
  value,
  defaultValue = "",
  placeholder,
  type = "text",
  required,
  minLength,
  maxLength,
  pattern,
  disabled,
  readOnly,
  autoFocus,
  helperText,
  error,
  inputProps,
  clearable,
  showPasswordToggle,
  prefixIcon,
  suffixIcon,
  size = "medium",
  variant = "outlined",
  fullWidth = true,
  onChange,
  onBlur,
  onFocus,
  onEnter,
}: AdTextBoxProps) {
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState<string>(value ?? defaultValue);
  const [internalError, setInternalError] = useState("");
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isControlled && value !== undefined) {
      setInnerValue(value);
      if (touched) {
        setInternalError(runValidation({ required, minLength, maxLength, pattern, type }, value));
      }
    }
  }, [isControlled, maxLength, minLength, pattern, required, touched, type, value]);

  const resolvedError = useMemo(() => error ?? (touched ? internalError : ""), [error, internalError, touched]);

  const handleChange: TextFieldProps["onChange"] = (e) => {
    const rawVal = e.target.value;
    const numericMin = readNumericBound(inputProps?.min);
    const numericMax = readNumericBound(inputProps?.max);
    const val =
      type === "number"
        ? clampNumberInput(normalizeNumberInput(rawVal), numericMin, numericMax)
        : rawVal;
    if (!isControlled) setInnerValue(val);
    if (!touched) setTouched(true);

    const validationMsg = runValidation(
      { required, minLength, maxLength, pattern, type },
      val
    );
    setInternalError(validationMsg);

    onChange?.(val);
  };

  const handleKeyDown: TextFieldProps["onKeyDown"] = (e) => {
    if (type === "number" && (e.key === "-" || e.key === "Minus" || e.key === "Subtract")) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") onEnter?.();
  };

  const handleBlur: TextFieldProps["onBlur"] = (e) => {
    setTouched(true);
    const numericMin = readNumericBound(inputProps?.min);
    const numericMax = readNumericBound(inputProps?.max);
    const val =
      type === "number"
        ? clampNumberInput(normalizeNumberInput(e.target.value), numericMin, numericMax)
        : e.target.value;
    if (!isControlled && type === "number") setInnerValue(val);
    if (type === "number" && val !== e.target.value) onChange?.(val);
    setInternalError(runValidation({ required, minLength, maxLength, pattern, type }, val));
    onBlur?.(e);
  };

  const currentValue = isControlled ? value ?? "" : innerValue;
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      name={name}
      value={currentValue}
      placeholder={placeholder}
      type={inputType}
      required={required}
      disabled={disabled}
      inputProps={{ readOnly, maxLength, ...inputProps }}
      autoFocus={autoFocus}
      size={size}
      variant={variant}
      helperText={resolvedError || helperText}
      error={Boolean(resolvedError)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={onFocus}
      onKeyDown={handleKeyDown}
      InputProps={{
        startAdornment: prefixIcon ? (
          <InputAdornment position="start">{prefixIcon}</InputAdornment>
        ) : undefined,
        endAdornment: (
          <InputAdornment position="end" sx={{ gap: 0.5 }}>
            {clearable && currentValue ? (
              <IconButton
                aria-label="Clear input"
                edge="end"
                onClick={() => {
                  if (!isControlled) setInnerValue("");
                  setInternalError("");
                  onChange?.("");
                }}
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null}

            {type === "password" && showPasswordToggle ? (
              <IconButton
                aria-label="Toggle password visibility"
                edge="end"
                onClick={() => setShowPassword((prev) => !prev)}
                size="small"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            ) : null}

            {suffixIcon ? <InputAdornment position="end">{suffixIcon}</InputAdornment> : null}
          </InputAdornment>
        ),
      }}
    />
  );
}
