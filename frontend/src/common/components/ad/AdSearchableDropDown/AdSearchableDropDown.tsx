import { Autocomplete, TextField } from "@mui/material";
import type { AdDropDownOption } from "../AdDropDown/AdDropDown";

export type AdSearchableDropDownProps = {
  label?: string;
  options: AdDropDownOption[];
  value?: string | number;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  onChange?: (value: string | number) => void;
};

export function AdSearchableDropDown({
  label,
  options,
  value,
  required = false,
  disabled = false,
  placeholder,
  helperText,
  error = false,
  fullWidth = true,
  onChange,
}: AdSearchableDropDownProps) {
  const selected = options.find((opt) => String(opt.value) === String(value ?? "")) ?? null;

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size="small"
      options={options}
      value={selected}
      disabled={disabled}
      isOptionEqualToValue={(option, current) => String(option.value) === String(current.value)}
      getOptionLabel={(option) => option.label}
      onChange={(_, next) => onChange?.(next?.value ?? "")}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          placeholder={placeholder}
          helperText={helperText}
          error={error}
        />
      )}
    />
  );
}
