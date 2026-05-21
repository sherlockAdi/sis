import { useState } from "react";
import { Box, MenuItem, Select, TextField, type SelectChangeEvent, type TextFieldProps } from "@mui/material";

type PhoneCountry = {
  code: string;
  label: string;
  flag: string;
};

const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
  { code: "+965", label: "Kuwait", flag: "🇰🇼" },
  { code: "+974", label: "Qatar", flag: "🇶🇦" },
  { code: "+968", label: "Oman", flag: "🇴🇲" },
  { code: "+973", label: "Bahrain", flag: "🇧🇭" },
  { code: "+1", label: "USA", flag: "🇺🇸" },
];

export type AdPhoneFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
};

export function AdPhoneField({
  label = "Mobile",
  value,
  onChange,
  helperText,
  error = false,
  disabled = false,
  required = false,
  fullWidth = true,
  size = "small",
}: AdPhoneFieldProps) {
  const [prefix, setPrefix] = useState("+91");

  const activePrefix = PHONE_COUNTRIES.find((opt) => opt.code === prefix) ?? PHONE_COUNTRIES[0];

  const handlePrefixChange = (event: SelectChangeEvent<string>) => {
    setPrefix(event.target.value);
  };

  const handleChange: TextFieldProps["onChange"] = (event) => {
    onChange(event.target.value.replace(/\D/g, "").slice(0, 10));
  };

  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      label={label}
      value={value}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      error={error}
      helperText={helperText}
      inputProps={{ inputMode: "numeric", maxLength: 10, pattern: "\\d{10}" }}
      InputProps={{
        startAdornment: (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              borderRight: "1px solid rgba(148,163,184,0.45)",
              pr: 0.75,
              mr: 0.75,
            }}
          >
            <Select
              value={prefix}
              onChange={handlePrefixChange}
              variant="standard"
              disableUnderline
              disabled={disabled}
              sx={{
                minWidth: 104,
                fontSize: 13,
                "& .MuiSelect-select": { display: "flex", alignItems: "center", gap: 0.75, py: 0.5 },
              }}
              renderValue={() => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <span>{activePrefix.flag}</span>
                  <span>{activePrefix.code}</span>
                </Box>
              )}
            >
              {PHONE_COUNTRIES.map((opt) => (
                <MenuItem key={opt.code} value={opt.code}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{opt.flag}</span>
                    <span>{opt.code}</span>
                    <span style={{ color: "rgba(71,85,105,1)" }}>{opt.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </Box>
        ),
      }}
    />
  );
}
