import { useEffect, useState } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import  { Dayjs } from "dayjs";

export type AdDateTimePickerProps = {
  label?: string;
  value?: Dayjs | null;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onChange?: (value: Dayjs | null) => void;
};

export function AdDateTimePicker({
  label,
  value = null,
  required = false,
  disabled = false,
  fullWidth = true,
  onChange,
}: AdDateTimePickerProps) {
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
      <DateTimePicker
        label={label}
        value={selected}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          textField: {
            required,
            fullWidth,
            size: "small",
          },
        }}
      />
    </LocalizationProvider>
  );
}
