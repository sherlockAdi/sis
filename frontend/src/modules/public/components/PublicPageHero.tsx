import { Box, Container, Stack, Typography } from "@mui/material";

export default function PublicPageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={1.5}>
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
            <Typography sx={{ color: "text.secondary", maxWidth: 980 }}>{subtitle}</Typography>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}

