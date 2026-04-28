import { useEffect, useState } from "react";
import { Autocomplete, Checkbox, TextField } from "@mui/material";
import type { AdDropDownOption } from "../AdDropDown/AdDropDown";

export type AdSearchableDropDownMultiProps = {
  label?: string;
  options: AdDropDownOption[];
  value?: string[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  variant?: "standard" | "outlined" | "filled";
  onChange?: (value: string[]) => void;
};

export function AdSearchableDropDownMulti({
  label,
  options,
  value = [],
  required = false,
  disabled = false,
  placeholder,
  helperText,
  error = false,
  fullWidth = true,
  variant = "outlined",
  onChange,
}: AdSearchableDropDownMultiProps) {
  const [selected, setSelected] = useState(() => options.filter((opt) => value.includes(String(opt.value))));

  useEffect(() => {
    setSelected(options.filter((opt) => value.includes(String(opt.value))));
  }, [options, value]);

  return (
    <Autocomplete
      multiple
      fullWidth={fullWidth}
      size="small"
      options={options}
      value={selected}
      disabled={disabled}
      disableCloseOnSelect
      isOptionEqualToValue={(option, current) => String(option.value) === String(current.value)}
      getOptionLabel={(option) => option.label}
      onChange={(_, next) => {
        const nextSelected = next.map((opt) => String(opt.value));
        setSelected(next);
        onChange?.(nextSelected);
      }}
      renderOption={(props, option, { selected }) => (
        <li {...props} key={option.value}>
          <Checkbox checked={selected} sx={{ mr: 1 }} />
          {option.label}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
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
