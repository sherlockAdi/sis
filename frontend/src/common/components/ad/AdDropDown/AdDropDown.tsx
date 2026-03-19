import { useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";

export type AdDropDownOption = {
  label: string;
  value: string | number;
};

export type AdDropDownProps = {
  label?: string;
  options: AdDropDownOption[];
  value?: string | number;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onChange?: (value: string | number) => void;
};

export function AdDropDown({
  label,
  options,
  value,
  required = false,
  fullWidth = true,
  disabled = false,
  onChange,
}: AdDropDownProps) {
  const [selected, setSelected] = useState<string | number>(value ?? "");

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  const handleChange = (event: SelectChangeEvent<string | number>) => {
    const val = event.target.value;
    setSelected(val);
    onChange?.(val);
  };

  return (
    <FormControl fullWidth={fullWidth} size="small" disabled={disabled}>
      {label && <InputLabel required={required}>{label}</InputLabel>}

      <Select<string | number>
        value={selected}
        label={label}
        onChange={handleChange}
        disabled={disabled}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
