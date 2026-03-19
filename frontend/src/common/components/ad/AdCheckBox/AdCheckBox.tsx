import { useEffect, useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";

export type AdCheckBoxProps = {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};

export function AdCheckBox({
  label,
  checked = false,
  disabled = false,
  onChange,
}: AdCheckBoxProps) {
  const [value, setValue] = useState(checked);

  useEffect(() => {
    setValue(checked);
  }, [checked]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={value}
          disabled={disabled}
          onChange={handleChange}
        />
      }
      label={label}
    />
  );
}
