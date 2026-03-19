import type { ReactNode } from "react";
import { Card, CardContent, Stack, Typography, Zoom } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type AdCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  children?: ReactNode;
  /** Enable entry animation (Zoom). */
  animate?: boolean;
  /** Zoom transition duration in ms. */
  timeoutMs?: number;
  /** Zoom transition delay in ms. */
  delayMs?: number;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

export function AdCard({
  title,
  subtitle,
  headerRight,
  children,
  animate = true,
  timeoutMs = 600,
  delayMs = 80,
  sx,
  contentSx,
}: AdCardProps) {
  const card = (
    <Card
      sx={[
        {
          backdropFilter: "none",
          backgroundColor: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.28)",
          boxShadow: "0 12px 36px rgba(15,23,42,0.12)",
        },
        sx,
      ]}
    >
      <CardContent sx={contentSx}>
        {(title || subtitle || headerRight) && (
          <Stack
            direction="row"
            alignItems="flex-start"
            spacing={2}
            sx={{ mb: title || subtitle ? 2 : 0 }}
          >
            <Stack spacing={0.25} flex={1} minWidth={0}>
              {title && (
                <Typography variant="h6" fontWeight={700}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Stack>
            {headerRight}
          </Stack>
        )}
        {children}
      </CardContent>
    </Card>
  );

  if (!animate) return card;

  return (
    <Zoom in timeout={timeoutMs} style={{ transitionDelay: `${delayMs}ms` }}>
      {card}
    </Zoom>
  );
}

