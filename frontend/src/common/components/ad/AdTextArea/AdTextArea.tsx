import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import { type AdTextAreaProps } from "./AdTextArea.types";

// Validation function
function runValidation(props: AdTextAreaProps, val: string) {
  const { required, minLength, maxLength } = props;

  if (required && !val) return "This field is required";
  if (minLength && val.length < minLength) return `Minimum ${minLength} characters required`;
  if (maxLength && val.length > maxLength) return `Maximum ${maxLength} characters allowed`;

  return "";
}

export default function AdTextArea({
  label,
  name,
  value,
  defaultValue = "",
  placeholder,
  required,
  minLength,
  maxLength,
  disabled,
  readOnly,
  autoFocus,
  helperText,
  error,
  minRows = 3,
  maxRows = 6,
  fullWidth = true,
  onChange,
  onBlur,
  onFocus,
}: AdTextAreaProps) {
  const isControlled = value !== undefined;

  const [innerValue, setInnerValue] = useState<string>(value ?? defaultValue);
  const [internalError, setInternalError] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isControlled && value !== undefined) {
      setInnerValue(value);
      if (touched) {
        setInternalError(runValidation({ required, minLength, maxLength }, value));
      }
    }
  }, [value, isControlled, required, minLength, maxLength, touched]);

  const resolvedError = useMemo(() => error ?? (touched ? internalError : ""), [error, internalError, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;

    if (!isControlled) setInnerValue(val);
    if (!touched) setTouched(true);

    const validationMsg = runValidation({ required, minLength, maxLength }, val);
    setInternalError(validationMsg);

    onChange?.(val);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(true);
    const val = e.target.value;
    setInternalError(runValidation({ required, minLength, maxLength }, val));
    onBlur?.(e);
  };

  const currentValue = isControlled ? value ?? "" : innerValue;

  return (
    <Box width={fullWidth ? "100%" : "auto"}>
      {/* Label */}
      {label && (
        <Typography variant="body2" fontWeight={500} mb={0.2}>
          {label}
          {required && " *"}
        </Typography>
      )}

      {/* Textarea Container */}
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: resolvedError ? "error.main" : "rgba(15,23,42,0.22)",
          backgroundColor: disabled ? "#f5f5f5" : "transparent",
          transition: "border-color 120ms ease",
          "&:focus-within": {
            borderColor: resolvedError ? "error.main" : "primary.main",
          },
        }}
      >
        <TextareaAutosize
          name={name}
          value={currentValue}
          placeholder={placeholder}
          minRows={minRows}
          maxRows={maxRows}
          disabled={disabled}
          autoFocus={autoFocus}
          readOnly={readOnly}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={onFocus}
          style={{
            width: "100%",
            padding: "6px 4px 7px",
            border: "none",
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: "13px",
            background: "transparent",
            lineHeight: "1.35",
            color: "black",
          }}
        />
      </Box>

      {/* Helper / Error Text */}
      {(resolvedError || helperText) && (
        <Typography
          variant="caption"
          color={resolvedError ? "error" : "text.secondary"}
          mt={0.5}
        >
          {resolvedError || helperText}
        </Typography>
      )}
    </Box>
  );
}
