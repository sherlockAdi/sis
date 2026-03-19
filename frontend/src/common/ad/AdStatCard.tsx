import { Card, CardContent, Stack, Typography } from "@mui/material";

type AdStatCardProps = {
  label: string;
  value: string | number;
  helperText?: string;
};

/** Lightweight stat card for dashboards (OPD/IPD). */
export default function AdStatCard({ label, value, helperText }: AdStatCardProps) {
  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
          {helperText && (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
