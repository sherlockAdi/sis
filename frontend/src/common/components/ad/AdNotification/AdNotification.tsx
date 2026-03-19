import { Alert, Snackbar } from "@mui/material";
import type { AlertColor, SnackbarOrigin } from "@mui/material";

export type AdNotificationProps = {
  open: boolean;
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  anchorOrigin?: SnackbarOrigin;
  onClose?: () => void;
};

export function AdNotification({
  open,
  message,
  severity = "info",
  autoHideDuration = 3000,
  anchorOrigin = { vertical: "top", horizontal: "right" },
  onClose,
}: AdNotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={() => onClose?.()}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={() => onClose?.()} severity={severity} variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

