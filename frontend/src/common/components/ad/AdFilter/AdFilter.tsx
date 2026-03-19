import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Box, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import CloseIcon from "@mui/icons-material/Close";
import { AdButton, type AdButtonProps } from "../AdButton";

export type AdFilterProps = {
  title?: ReactNode;
  width?: number | string;
  /** Which side the filter should open from. */
  anchor?: "left" | "right";
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Called whenever open changes. */
  onOpenChange?: (open: boolean) => void;
  /** Show the default trigger button. */
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerProps?: Omit<AdButtonProps, "children" | "onClick" | "startIcon">;
  children?: ReactNode;
  footer?: ReactNode;
};

export function AdFilter({
  title = "Filters",
  width = 360,
  anchor = "right",
  open,
  defaultOpen = false,
  onOpenChange,
  showTrigger = true,
  triggerLabel = "Filter",
  triggerProps,
  children,
  footer,
}: AdFilterProps) {
  const isControlled = open !== undefined;
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const resolvedOpen = isControlled ? Boolean(open) : innerOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const paperSx = useMemo(
    () => ({
      width,
      maxWidth: "90vw",
      p: 2,
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }),
    [width],
  );

  return (
    <>
      {showTrigger ? (
        <AdButton
          variant="secondary"
          startIcon={<FilterAltIcon />}
          onClick={() => setOpen(true)}
          {...triggerProps}
        >
          {triggerLabel}
        </AdButton>
      ) : null}

      <Drawer anchor={anchor} open={resolvedOpen} onClose={() => setOpen(false)}>
        <Box sx={paperSx} role="dialog" aria-label="Filters">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={800} flex={1}>
              {title}
            </Typography>
            <IconButton aria-label="Close filters" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider />

          <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>

          {footer ? (
            <>
              <Divider />
              <Box>{footer}</Box>
            </>
          ) : null}
        </Box>
      </Drawer>
    </>
  );
}
