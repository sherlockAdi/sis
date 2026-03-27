import { Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

const posts = [
  {
    date: "31",
    month: "Mar",
    title: "SIS expands overseas hiring pipeline for priority roles",
    excerpt: "Faster job discovery, structured partner submissions, and improved employer trust signals across key regions.",
  },
  {
    date: "19",
    month: "Mar",
    title: "New training module launched for deployment readiness",
    excerpt: "Documentation accuracy, interview preparation, and role-based readiness in one standardized journey.",
  },
];

export default function NewsMediaPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Company"
        title="News"
        highlight="& Media"
        subtitle="Updates on hiring programs, deployments, and partner ecosystem improvements."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          {posts.map((p) => (
            <Box key={p.title} sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "110px 1fr" }, gap: 2.5, alignItems: "start" }}>
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: 2.5,
                    bgcolor: "secondary.main",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography fontWeight={950} sx={{ fontSize: 28, lineHeight: 1 }}>
                      {p.date}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {p.month}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={950}>
                    {p.title}
                  </Typography>
                  <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.85 }}>
                    {p.excerpt}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Button variant="contained" sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}>
                    Read More
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

