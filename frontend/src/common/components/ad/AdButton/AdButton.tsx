import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type  { ReactNode } from "react";

export type AdButtonVariant = "primary" | "secondary" | "text";

export interface AdButtonProps extends Omit<ButtonProps, "variant"> {
  /** visual style */
  variant?: AdButtonVariant;
  /** show spinner and disable */
  loading?: boolean;
  /** optional left icon */
  startIcon?: ReactNode;
  /** optional right icon */
  endIcon?: ReactNode;
}

const paletteMap: Record<AdButtonVariant, ButtonProps["color"]> = {
  primary: "primary",
  secondary: "secondary",
  text: "inherit",
};

export default function AdButton({
  children,
  variant = "primary",
  loading = false,
  startIcon,
  endIcon,
  disabled,
  ...rest
}: AdButtonProps) {
  const color = paletteMap[variant] ?? "primary";
  const isText = variant === "text";

  return (
    <Button
      variant={isText ? "text" : "contained"}
      color={color}
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      {...rest}
    >
      {loading ? <CircularProgress size={18} thickness={4} /> : children}
    </Button>
  );
}
