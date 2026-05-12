import type { ReactNode } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { SisLogo } from "../../../common/ad";

export default function PublicPageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.paper",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(183,31,52,0.08) 0%, rgba(255,255,255,0.0) 42%, rgba(17,24,39,0.04) 100%)",
          pointerEvents: "none",
        }}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3} sx={{ position: "relative" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <SisLogo height={82} />
            </Box>
            {actions ? <Box>{actions}</Box> : null}
          </Stack>
          <Stack spacing={1.5} sx={{ maxWidth: 980 }}>
            {eyebrow ? (
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1.2 }}>
                {eyebrow}
              </Typography>
            ) : null}
            <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
              {title}{" "}
              {highlight ? (
                <Box component="span" sx={{ color: "primary.main" }}>
                  {highlight}
                </Box>
              ) : null}
            </Typography>
            {subtitle ? (
              <Typography sx={{ color: "text.secondary", maxWidth: 980, lineHeight: 1.9 }}>{subtitle}</Typography>
            ) : null}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
