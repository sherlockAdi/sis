import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import {
  Alert,
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AdButton, AdCard, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateTradeLinkRow } from "../../common/services/candidateApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

type TradeLinkDraft = CandidateTradeLinkRow & {
  local_id: string;
};

type TradeTestDraft = {
  trade_video_file_path: string | null;
  trade_video_file_name: string | null;
  trade_video_file_size: number | null;
  trade_video_uploaded_at: string | null;
  trade_video_links: TradeLinkDraft[];
};

const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

function makeId() {
  return `tt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sanitizeFileName(name: string): string {
  const cleaned = String(name ?? "").trim().replace(/[^\w.\-]+/g, "_");
  return cleaned || "video.mp4";
}

function makeEmptyDraft(): TradeTestDraft {
  return {
    trade_video_file_path: null,
    trade_video_file_name: null,
    trade_video_file_size: null,
    trade_video_uploaded_at: null,
    trade_video_links: [],
  };
}

function makeLinkDraft(): TradeLinkDraft {
  return {
    local_id: makeId(),
    id: makeId(),
    title: "",
    url: "",
  };
}

function normalizeLink(link: CandidateTradeLinkRow): TradeLinkDraft {
  const id = link.id || makeId();
  return {
    local_id: id,
    id,
    title: link.title ?? "",
    url: link.url ?? "",
  };
}

function toPayload(draft: TradeTestDraft) {
  return {
    trade_video_file_path: draft.trade_video_file_path,
    trade_video_file_name: draft.trade_video_file_name,
    trade_video_file_size: draft.trade_video_file_size,
    trade_video_uploaded_at: draft.trade_video_uploaded_at,
    trade_video_links: draft.trade_video_links.map(({ local_id, ...row }) => row),
  };
}

export default function CandidateProfileTradeTestPage() {
  const [draft, setDraft] = useState<TradeTestDraft>(makeEmptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const hasVideo = Boolean(draft.trade_video_file_path?.trim());
  const linkCount = draft.trade_video_links.filter((row) => String(row.url ?? "").trim()).length;

  const loadTradeTest = async () => {
    setLoading(true);
    try {
      const data = await candidateApi.tradeTest.get();
      setDraft({
        trade_video_file_path: data.trade_video_file_path,
        trade_video_file_name: data.trade_video_file_name,
        trade_video_file_size: data.trade_video_file_size,
        trade_video_uploaded_at: data.trade_video_uploaded_at,
        trade_video_links: (data.trade_video_links ?? []).map(normalizeLink),
      });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load trade test data", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTradeTest();
  }, []);

  const updateLink = (local_id: string, next: Partial<TradeLinkDraft>) => {
    setDraft((prev) => ({
      ...prev,
      trade_video_links: prev.trade_video_links.map((row) => (row.local_id === local_id ? { ...row, ...next } : row)),
    }));
  };

  const addLink = () => {
    setDraft((prev) => ({
      ...prev,
      trade_video_links: [...prev.trade_video_links, makeLinkDraft()],
    }));
  };

  const removeLink = (local_id: string) => {
    setDraft((prev) => ({
      ...prev,
      trade_video_links: prev.trade_video_links.filter((row) => row.local_id !== local_id),
    }));
  };

  const saveTradeTest = async (nextDraft: TradeTestDraft = draft) => {
    setSaving(true);
    try {
      await candidateApi.tradeTest.update(toPayload(nextDraft));
      setToast({ open: true, message: "Trade test details saved", severity: "success" });
      await loadTradeTest();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save trade test data", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const uploadVideo = async (file: File) => {
    if (file.size > MAX_VIDEO_BYTES) {
      setToast({
        open: true,
        message: `Video must be 10 MB or smaller. Selected file is ${formatBytes(file.size)}.`,
        severity: "error",
      });
      return;
    }

    setUploading(true);
    try {
      const objectKey = `candidate/trade-test/${Date.now()}-${sanitizeFileName(file.name)}`;
      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      const nextDraft: TradeTestDraft = {
        ...draft,
        trade_video_file_path: objectKey,
        trade_video_file_name: file.name,
        trade_video_file_size: file.size,
        trade_video_uploaded_at: new Date().toISOString(),
      };
      setDraft(nextDraft);
      await saveTradeTest(nextDraft);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    } finally {
      setUploading(false);
    }
  };

  const openVideo = async () => {
    if (!draft.trade_video_file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(draft.trade_video_file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open video", severity: "error" });
    }
  };

  const clearVideo = async () => {
    const nextDraft: TradeTestDraft = {
      ...draft,
      trade_video_file_path: null,
      trade_video_file_name: null,
      trade_video_file_size: null,
      trade_video_uploaded_at: null,
    };
    setDraft(nextDraft);
    await saveTradeTest(nextDraft);
  };

  const linkRows = useMemo(() => draft.trade_video_links, [draft.trade_video_links]);

  return (
    <Box sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 1.5, md: 2 } }}>
      <Stack spacing={2}>
        <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Trade Test
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Upload one trade video and add multiple trade video links. Everything saves to the database.
          </Typography>
        </Box>

        <AdCard animate={false} sx={{ background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(29,78,216,0.88))", color: "#fff" }} contentSx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <VideoLibraryIcon />
              <Box>
                <Typography fontWeight={900}>Candidate Trade Media</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  One uploaded video. Multiple links. Clean and compact.
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Links: ${linkCount}`} sx={{ color: "#fff" }} />
              <Chip label={`Video: ${hasVideo ? "1" : "0"}`} sx={{ color: "#fff" }} />
              <Chip label="Max 10 MB" sx={{ color: "#fff" }} />
            </Stack>
          </Stack>
        </AdCard>

        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.8)" }} contentSx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
              <Box sx={{ flex: "0 0 34%", minWidth: 280 }}>
                <Stack spacing={1.25}>
                  <Typography fontWeight={950}>Trade Video</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload only one video file for the trade test.
                  </Typography>

                  <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 1.5, backgroundColor: "rgba(255,255,255,0.88)" }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography fontWeight={800}>Current File</Typography>
                        {hasVideo ? <Chip size="small" label="Saved" color="success" /> : <Chip size="small" label="Empty" variant="outlined" />}
                      </Stack>

                      <Typography variant="body2" sx={{ wordBreak: "break-word" }} color={hasVideo ? "text.primary" : "text.secondary"}>
                        {draft.trade_video_file_name || "No video uploaded yet"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {hasVideo ? `Size: ${formatBytes(draft.trade_video_file_size)} • Uploaded: ${draft.trade_video_uploaded_at ?? "—"}` : "Accepted format: video/*"}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <AdButton component="label" startIcon={<UploadFileIcon fontSize="small" />} disabled={uploading}>
                          {hasVideo ? "Replace Video" : "Upload Video"}
                          <input
                            type="file"
                            hidden
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadVideo(file);
                              e.currentTarget.value = "";
                            }}
                          />
                        </AdButton>

                        <AdButton variant="outlined" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => void openVideo()} disabled={!hasVideo}>
                          Open
                        </AdButton>

                        <AdButton variant="text" onClick={() => void clearVideo()} disabled={!hasVideo}>
                          Clear
                        </AdButton>
                      </Stack>
                    </Stack>
                  </Paper>

                  <Alert severity="info" sx={{ py: 0.75 }}>
                    Video files over 10 MB are blocked before upload.
                  </Alert>
                </Stack>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography fontWeight={950}>Trade Video Links</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add as many links as needed. Each row is saved to the database.
                      </Typography>
                    </Box>
                    <AdButton startIcon={<AddIcon />} onClick={addLink}>
                      Add Link
                    </AdButton>
                  </Stack>

                  <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "rgba(15,23,42,0.04)" }}>
                          <TableCell sx={{ fontWeight: 900, width: "32%" }}>Title</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Video Link</TableCell>
                          <TableCell sx={{ fontWeight: 900, width: 120 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {linkRows.length ? (
                          linkRows.map((row) => (
                            <TableRow key={row.local_id} hover>
                              <TableCell sx={{ verticalAlign: "top" }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Short title"
                                  value={row.title}
                                  onChange={(e) => updateLink(row.local_id, { title: e.target.value })}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top" }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="https://..."
                                  value={row.url}
                                  onChange={(e) => updateLink(row.local_id, { url: e.target.value })}
                                />
                              </TableCell>
                              <TableCell sx={{ verticalAlign: "top" }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <IconButton
                                    size="small"
                                    aria-label="Open link"
                                    disabled={!String(row.url ?? "").trim()}
                                    onClick={() => window.open(row.url, "_blank", "noopener,noreferrer")}
                                  >
                                    <OpenInNewIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" aria-label="Delete link" onClick={() => removeLink(row.local_id)}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                No links added yet. Click Add Link to start.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Paper>

                  <Typography variant="caption" color="text.secondary">
                    Keep the layout compact, add only the links you need, and save once after editing.
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} justifyContent="space-between" alignItems={{ md: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {loading ? "Loading trade test data..." : "Changes are stored in the database for this candidate."}
              </Typography>
              <Stack direction="row" spacing={1}>
                <AdButton variant="outlined" onClick={() => void loadTradeTest()} disabled={loading || saving || uploading}>
                  Refresh
                </AdButton>
                <AdButton onClick={() => void saveTradeTest()} disabled={loading || saving || uploading}>
                  Save Changes
                </AdButton>
              </Stack>
            </Stack>
          </Stack>
        </AdCard>
      </Stack>
    </Box>
  );
}
