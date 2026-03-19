import type { ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { DialogProps } from "@mui/material/Dialog";

export type AdModalProps = Omit<DialogProps, "title"> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Show top-right close icon. */
  closable?: boolean;
};

export function AdModal({
  title,
  subtitle,
  actions,
  closable = true,
  onClose,
  children,
  ...rest
}: AdModalProps) {
  return (
    <Dialog
      {...rest}
      onClose={(e, reason) => onClose?.(e, reason)}
      fullWidth={rest.fullWidth ?? true}
      maxWidth={rest.maxWidth ?? "sm"}
    >
      {title || closable ? (
        <DialogTitle sx={{ pr: closable ? 6 : 3 }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Box flex={1} minWidth={0}>
              {title ? (
                typeof title === "string" ? (
                  <Typography variant="h6" fontWeight={800}>
                    {title}
                  </Typography>
                ) : (
                  title
                )
              ) : null}
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>

            {closable ? (
              <IconButton
                aria-label="Close"
                onClick={() => onClose?.({} as any, "escapeKeyDown")}
                sx={{ mt: -0.5, mr: -1 }}
              >
                <CloseIcon />
              </IconButton>
            ) : null}
          </Stack>
        </DialogTitle>
      ) : null}

      <DialogContent dividers>{children}</DialogContent>
      {actions ? <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions> : null}
    </Dialog>
  );
}

