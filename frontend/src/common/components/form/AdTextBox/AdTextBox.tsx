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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isControlled && value !== undefined) {
      setInnerValue(value);
      setInternalError(runValidation({ required, minLength, maxLength, pattern, type }, value));
    }
  }, [isControlled, maxLength, minLength, pattern, required, type, value]);

  const resolvedError = useMemo(() => error ?? internalError, [error, internalError]);

  const handleChange: TextFieldProps["onChange"] = (e) => {
    const val = e.target.value;
    if (!isControlled) setInnerValue(val);

    const validationMsg = runValidation(
      { required, minLength, maxLength, pattern, type },
      val
    );
    setInternalError(validationMsg);

    onChange?.(val);
  };

  const handleKeyDown: TextFieldProps["onKeyDown"] = (e) => {
    if (e.key === "Enter") onEnter?.();
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
      inputProps={{ readOnly, maxLength }}
      autoFocus={autoFocus}
      size={size}
      variant={variant}
      helperText={resolvedError || helperText}
      error={Boolean(resolvedError)}
      onChange={handleChange}
      onBlur={onBlur}
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
