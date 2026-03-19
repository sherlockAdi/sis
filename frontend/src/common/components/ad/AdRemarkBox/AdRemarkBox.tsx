import { useEffect, useMemo, useState } from "react";
import { TextField, InputAdornment } from "@mui/material";
import {type AdRemarkBoxProps } from "./AdRemarkBox..types";

function runValidation(props: AdRemarkBoxProps, val: string) {
  const { required, minLength, maxLength } = props;

  if (required && !val) return "Remark is required";
  if (minLength && val.length < minLength)
    return `Minimum ${minLength} characters required`;
  if (maxLength && val.length > maxLength)
    return `Maximum ${maxLength} characters allowed`;

  return "";
}

export default function AdRemarkBox({
  label = "Remarks",
  name,
  value,
  defaultValue = "",
  placeholder = "Enter remarks...",
  required,
  minLength,
  maxLength,
  disabled,
  readOnly,
  autoFocus,
  helperText,
  error,
  prefixIcon,
  suffixIcon,
  rows = 4,
  minRows,
  maxRows,
  size = "medium",
  variant = "outlined",
  fullWidth = true,
  onChange,
  onBlur,
  onFocus,
}: AdRemarkBoxProps) {
  const isControlled = value !== undefined;

  const [innerValue, setInnerValue] = useState<string>(value ?? defaultValue);
  const [internalError, setInternalError] = useState("");

  useEffect(() => {
    if (isControlled && value !== undefined) {
      setInnerValue(value);
      setInternalError(
        runValidation({ required, minLength, maxLength }, value)
      );
    }
  }, [value, isControlled, required, minLength, maxLength]);

  const resolvedError = useMemo(
    () => error ?? internalError,
    [error, internalError]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!isControlled) setInnerValue(val);

    const validationMsg = runValidation(
      { required, minLength, maxLength },
      val
    );

    setInternalError(validationMsg);

    onChange?.(val);
  };

  const currentValue = isControlled ? value ?? "" : innerValue;

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      name={name}
      value={currentValue}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      size={size}
      variant={variant}
      multiline
      rows={rows}
      minRows={minRows}
      maxRows={maxRows}
      inputProps={{ readOnly, maxLength }}
      helperText={resolvedError || helperText}
      error={Boolean(resolvedError)}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      InputProps={{
        startAdornment: prefixIcon ? (
          <InputAdornment position="start">{prefixIcon}</InputAdornment>
        ) : undefined,
        endAdornment: suffixIcon ? (
          <InputAdornment position="end">{suffixIcon}</InputAdornment>
        ) : undefined,
      }}
    />
  );
}