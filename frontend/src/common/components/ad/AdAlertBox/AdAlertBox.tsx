import { useState, useEffect } from "react";
import { Alert, AlertTitle, IconButton, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export type AdAlertBoxProps = {
  severity?: "error" | "warning" | "info" | "success";
  title?: string;
  message: string;
  fullWidth?: boolean;
  closable?: boolean;
  autoHideDuration?: number; // in ms, optional
  onClose?: () => void;
};

export default function AdAlertBox({
  severity = "info",
  title,
  message,
  fullWidth = true,
  closable = true,
  autoHideDuration,
  onClose,
}: AdAlertBoxProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (autoHideDuration) {
      const timer = setTimeout(() => {
        setOpen(false);
        onClose?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onClose]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Collapse in={open}>
      <Alert
        severity={severity}
        sx={{ width: fullWidth ? "100%" : "auto", mb: 2 }}
        action={
          closable ? (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : null
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Collapse>
  );
}