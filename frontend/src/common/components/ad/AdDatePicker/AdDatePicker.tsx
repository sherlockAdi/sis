import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";

export type AdDatePickerProps = {
  label?: string;
  value?: Dayjs | null;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "standard" | "outlined" | "filled";
  onChange?: (value: Dayjs | null) => void;
};

export function AdDatePicker({
  label,
  value = null,
  required = false,
  disabled = false,
  fullWidth = true,
  variant = "outlined",
  onChange,
}: AdDatePickerProps) {
  const [selected, setSelected] = useState<Dayjs | null>(value);

  useEffect(() => {
    setSelected(value ?? null);
  }, [value]);

  const handleChange = (newValue: Dayjs | null) => {
    setSelected(newValue);
    onChange?.(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={selected}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          textField: {
            required,
            fullWidth,
            size: "small",
            variant,
          },
        }}
      />
    </LocalizationProvider>
  );
}
