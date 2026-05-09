import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { AdAlertBox, AdCard } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { dashboardApi, type DashboardCard, type PartnerDashboardResponse } from "../../common/services/dashboardApi";
import { useNavigate } from "react-router-dom";

type MetricTileProps = {
  card: DashboardCard;
  trend: string;
  accent?: string;
};

function MetricTile({ card, trend, accent }: MetricTileProps) {
  const isAlert = card.key === "pending_actions";
  const valueColor = isAlert ? "#dc2626" : accent ?? "#111827";

  return (
    <Box
      sx={{
        backgroundColor: isAlert ? "#fff5f5" : "#fff",
        border: "1px solid",
        borderColor: isAlert ? "#f5c2c7" : "#e5e7eb",
        borderRadius: 0,
        minHeight: 124,
        p: 1.25,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "none",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: isAlert ? "#dc2626" : "#6b7280",
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: 0.45,
          textTransform: "uppercase",
          minHeight: 30,
        }}
      >
        {card.label}
      </Typography>
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            lineHeight: 0.95,
            color: valueColor,
            letterSpacing: -1,
          }}
        >
          {card.value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: isAlert ? "#dc2626" : "#4b5563",
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {trend}
        </Typography>
      </Box>
    </Box>
  );
}

function PipelineBars({ data }: { data: PartnerDashboardResponse["charts"]["application_pipeline"] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const colors = ["#111111", "#333333", "#6b6b6b", "#a3a3a3", "#d4d4d4"];

  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        height: "100%",
      }}
      contentSx={{ p: 2, height: "100%" }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
            Application Pipeline
          </Typography>
          <FilterAltOutlinedIcon sx={{ fontSize: 18, color: "#6b7280" }} />
        </Stack>

        <Stack spacing={1.15} sx={{ flex: 1, justifyContent: "center", pb: 1 }}>
          {data.map((item, index) => {
            const width = `${Math.max(14, (item.value / maxValue) * 100)}%`;
            return (
              <Stack key={item.label} direction="row" alignItems="center" spacing={1.25}>
                <Typography variant="body2" sx={{ width: 88, color: "#111827", fontWeight: 700 }}>
                  {item.label}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 30,
                    backgroundColor: "#efefef",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width,
                      backgroundColor: colors[index] ?? "#111111",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        pl: 1,
                        color: index === 0 ? "#ffffff" : "#ffffff",
                        fontWeight: 900,
                        letterSpacing: 0.2,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </AdCard>
  );
}

function JobsByStatus({ data, onManage }: { data: PartnerDashboardResponse["charts"]["jobs_by_status"]; onManage: () => void }) {
  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        height: "100%",
      }}
      contentSx={{ p: 2, height: "100%" }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
          Jobs by Status
        </Typography>
        <Stack spacing={1.1} sx={{ flex: 1 }}>
          {data.map((item, index) => {
            const dotColors = ["#6b7280", "#9ca3af", "#f1a7b1", "#c4b5fd"];
            return (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.2,
                  px: 1.5,
                  py: 1.15,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#fafafa",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: dotColors[index] ?? "#6b7280",
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                    {item.label}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 900, color: "#111827" }}>
                  {String(item.value).padStart(2, "0")}
                </Typography>
              </Box>
            );
          })}
        </Stack>
        <Button
          onClick={onManage}
          variant="contained"
          disableElevation
          sx={{
            bgcolor: "#111111",
            color: "#fff",
            borderRadius: 0,
            textTransform: "none",
            fontWeight: 800,
            minHeight: 36,
            "&:hover": { bgcolor: "#000" },
          }}
        >
          Manage All Jobs
        </Button>
      </Stack>
    </AdCard>
  );
}

function RecentTrend({ data, onCreate }: { data: PartnerDashboardResponse["charts"]["applications_by_day"]; onCreate: () => void }) {
  const visibleData = data.slice(-5);
  const maxValue = Math.max(1, ...visibleData.map((item) => item.present));
  const points = visibleData
    .map((item, index) => {
      const x = visibleData.length <= 1 ? 0 : (index / (visibleData.length - 1)) * 100;
      const y = 100 - (item.present / maxValue) * 78;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        height: "100%",
      }}
      contentSx={{ p: 2, height: "100%" }}
    >
      <Stack spacing={1.2} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
              Recent Applications Trend
            </Typography>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700 }}>
              Daily volume for the past 5 days
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label="Last 5 Days" size="small" variant="outlined" sx={{ borderRadius: 0, fontWeight: 800 }} />
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1,
            position: "relative",
            minHeight: 220,
            border: "1px solid #f0f0f0",
            backgroundImage:
              "linear-gradient(to bottom, transparent 0%, transparent 24%, #f4f4f4 24%, #f4f4f4 25%, transparent 25%, transparent 49%, #f4f4f4 49%, #f4f4f4 50%, transparent 50%, transparent 74%, #f4f4f4 74%, #f4f4f4 75%, transparent 75%)",
          }}
        >
          <Box
            component="svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <polyline
              points={points}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {visibleData.map((item, index) => {
              const x = visibleData.length <= 1 ? 50 : (index / (visibleData.length - 1)) * 100;
              const y = 100 - (item.present / maxValue) * 78;
              return <circle key={`${item.day}-${index}`} cx={x} cy={y} r={1.5} fill="#111111" />;
            })}
          </Box>

          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 14,
              px: 3,
              display: "grid",
              gridTemplateColumns: `repeat(${visibleData.length}, minmax(0, 1fr))`,
              alignItems: "end",
            }}
          >
            {visibleData.map((item, index) => (
              <Stack key={`${item.day}-${index}`} alignItems="center" spacing={0.8}>
                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#111111" }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#111827" }}>
                  {index === visibleData.length - 1 ? `${item.day} (Today)` : item.day.toUpperCase()}
                </Typography>
              </Stack>
            ))}
          </Box>

          <IconButton
            onClick={onCreate}
            sx={{
              position: "absolute",
              right: 12,
              bottom: 12,
              width: 36,
              height: 36,
              bgcolor: "#111111",
              color: "#fff",
              borderRadius: 2,
              "&:hover": { bgcolor: "#000" },
            }}
            aria-label="Create job mandate"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Stack>
    </AdCard>
  );
}

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PartnerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardApi.partner();
        if (active) setData(res);
      } catch (e: any) {
        if (!active) return;
        const apiErr = e as ApiError;
        setError(apiErr?.message ?? "Failed to load partner dashboard");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => {
    const fallback: PartnerDashboardResponse["cards"] = data?.cards ?? [];
    const overrides: Record<string, string> = {
      total_jobs: "+4%",
      active_jobs: "Open Jobs",
      total_applications: "+12 this week",
      shortlisted: "36% Rate",
      interviews_scheduled: "6 Scheduled Today",
      selected: "Awaiting Acceptance",
      deployed: "On Site",
      pending_actions: "Urgent Attention",
    };
    return fallback.map((card) => ({
      ...card,
      trend: overrides[card.key] ?? card.trend,
    }));
  }, [data]);

  if (loading && !data) {
    return (
      <AdCard animate={false} sx={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", boxShadow: "none" }} contentSx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
          Loading dashboard...
        </Typography>
      </AdCard>
    );
  }

  if (error) {
    return <AdAlertBox severity="error" title="Error" message={error} />;
  }

  if (!data) return null;

  return (
    <Stack spacing={2.25} sx={{ opacity: loading ? 0.75 : 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(8, minmax(0, 1fr))",
          },
          gap: 1.2,
        }}
      >
        {cards.map((card) => (
          <MetricTile key={card.key} card={card} trend={card.trend} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.9fr" },
          gap: 1.5,
          alignItems: "stretch",
        }}
      >
        <PipelineBars data={data.charts.application_pipeline} />
        <JobsByStatus data={data.charts.jobs_by_status} onManage={() => navigate("/portal/partner/job-mandates")} />
      </Box>

      <RecentTrend data={data.charts.applications_by_day} onCreate={() => navigate("/portal/partner/job-mandates/new")} />
    </Stack>
  );
}
