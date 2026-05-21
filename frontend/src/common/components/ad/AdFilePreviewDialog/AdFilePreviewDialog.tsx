import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { recruitmentApi } from "../../../services/recruitmentApi";

type PreviewKind = "image" | "pdf" | "other";

export type AdFilePreviewDialogProps = {
  open: boolean;
  title: string;
  filePath?: string | null;
  onClose: () => void;
};

function getKind(filePath: string): PreviewKind {
  const lower = filePath.trim().toLowerCase();
  if (lower.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)) return "image";
  if (lower.endsWith(".pdf")) return "pdf";
  return "other";
}

export function AdFilePreviewDialog({ open, title, filePath, onClose }: AdFilePreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const kind = useMemo(() => (filePath ? getKind(filePath) : "other"), [filePath]);

  useEffect(() => {
    let alive = true;

    if (!open || !filePath) {
      setLoading(false);
      setUrl("");
      setError(null);
      return () => {
        alive = false;
      };
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const presign = await recruitmentApi.files.presignDownload(filePath);
        if (!alive) return;
        setUrl(presign.url);
      } catch (e: any) {
        if (!alive) return;
        setUrl("");
        setError(String(e?.message ?? "Failed to load preview"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [filePath, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {title}
            </Typography>
            {filePath ? (
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                {filePath}
              </Typography>
            ) : null}
          </Box>
          {url ? (
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon fontSize="small" />}
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new tab
            </Button>
          ) : null}
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: { xs: 360, md: 640 }, p: 0, bgcolor: "#0f172a" }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: { xs: 360, md: 640 }, color: "white" }}>
            <CircularProgress color="inherit" />
            <Typography variant="body2" sx={{ mt: 1.5 }}>
              Loading preview...
            </Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : url ? (
          kind === "image" ? (
            <Box
              component="img"
              src={url}
              alt={title}
              sx={{ display: "block", width: "100%", maxHeight: { xs: 360, md: 640 }, objectFit: "contain", bgcolor: "#0f172a" }}
            />
          ) : (
            <Box
              component="iframe"
              src={url}
              title={title}
              sx={{
                display: "block",
                width: "100%",
                height: { xs: 360, md: 640 },
                border: 0,
                bgcolor: "white",
              }}
            />
          )
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: { xs: 360, md: 640 }, color: "white", p: 3, textAlign: "center" }}>
            <Typography fontWeight={900}>No preview available</Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(255,255,255,0.72)" }}>
              The file could not be loaded for preview.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
