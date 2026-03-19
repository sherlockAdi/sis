import { useState } from "react";
import { Chip, Stack } from "@mui/material";

export type AdChipsProps = {
  label: string;
  color?: "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
  variant?: "filled" | "outlined";
  clickable?: boolean;
  deletable?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
};

export default function AdChips({
  label,
  color = "default",
  variant = "filled",
  clickable = false,
  deletable = false,
  onClick,
  onDelete,
}: AdChipsProps) {
  const [visible, setVisible] = useState(true);

  const handleDelete = () => {
    setVisible(false);
    onDelete?.();
  };

  if (!visible) return null;

  return (
    <Stack direction="row" spacing={1}>
      <Chip
        label={label}
        color={color}
        variant={variant}
        clickable={clickable}
        onClick={clickable ? onClick : undefined}
        onDelete={deletable ? handleDelete : undefined}
      />
    </Stack>
  );
}