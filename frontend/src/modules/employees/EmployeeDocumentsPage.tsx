import { useEffect, useMemo, useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { AdAlertBox, AdButton, AdCard, AdGrid } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { employeesApi, type EmployeeDetailRow } from "../../common/services/employeesApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

type DocRow = {
  id: number;
  document_name: string;
  file_path: string | null;
  status: string;
  note: string;
};

function cleanValue(value?: string | null): string {
  const text = String(value ?? "").trim();
  return text || "—";
}

export default function EmployeeDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeDetailRow | null>(null);
  const [rows, setRows] = useState<DocRow[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await employeesApi.me();
        if (!alive) return;
        setEmployee(row);
      } catch (e: any) {
        if (alive) setError((e as ApiError)?.message ?? "Failed to load documents");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!employee) {
      setRows([]);
      return;
    }

    setRows([
      {
        id: 1,
        document_name: "Resume Upload",
        file_path: employee.resume_file_path ?? null,
        status: employee.resume_file_path ? "Uploaded" : "Missing",
        note: "Candidate resume uploaded during registration.",
      },
      {
        id: 2,
        document_name: "Passport Upload",
        file_path: employee.passport_file_path ?? null,
        status: employee.passport_file_path ? "Uploaded" : "Missing",
        note: "Passport copy from candidate profile.",
      },
      {
        id: 3,
        document_name: "Aadhaar Upload",
        file_path: employee.aadhar_file_path ?? null,
        status: employee.aadhar_file_path ? "Uploaded" : "Missing",
        note: "Aadhaar document from candidate profile.",
      },
      {
        id: 4,
        document_name: "PAN Upload",
        file_path: employee.pan_file_path ?? null,
        status: employee.pan_file_path ? "Uploaded" : "Missing",
        note: "PAN document from candidate profile.",
      },
      {
        id: 5,
        document_name: "Voter ID Upload",
        file_path: employee.voter_id_file_path ?? null,
        status: employee.voter_id_file_path ? "Uploaded" : "Missing",
        note: "Voter ID document from candidate profile.",
      },
      {
        id: 6,
        document_name: "Profile Photo",
        file_path: employee.profile_photo_file_path ?? null,
        status: employee.profile_photo_file_path ? "Uploaded" : "Missing",
        note: "Profile photo uploaded in job profile.",
      },
    ]);
  }, [employee]);

  const metaChips = useMemo(
    () => [
      `Employee ${cleanValue(employee?.employee_code)}`,
      `Candidate ${cleanValue(employee?.candidate_id ? `#${employee.candidate_id}` : null)}`,
      cleanValue(employee?.work_location),
      cleanValue(employee?.employment_status),
    ],
    [employee],
  );

  const openFile = async (filePath: string) => {
    try {
      const presign = await recruitmentApi.files.presignDownload(filePath);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to open file");
    }
  };

  return (
    <Container maxWidth="xl" disableGutters sx={{ minHeight: "100vh", px: { xs: 1, md: 1.5 }, py: { xs: 1, md: 1.5 }, bgcolor: "#eef2f7" }}>
      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            View Documents
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            All employee job-profile documents are listed here with their MinIO paths.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {metaChips.map((chip) => (
            <Box
              key={chip}
              sx={{
                px: 1.25,
                py: 0.6,
                borderRadius: 999,
                bgcolor: "#fff",
                border: "1px solid rgba(148,163,184,0.35)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {chip}
            </Box>
          ))}
        </Box>

        <AdCard animate={false} contentSx={{ p: 1.5 }}>
          <Stack spacing={1.25}>
            <Typography fontWeight={900}>Documents</Typography>
            <AdGrid
              rows={rows.map((r) => ({ ...r, id: r.id }))}
              columns={[
                { field: "document_name", headerName: "Document", flex: 1, minWidth: 220 },
                { field: "file_path", headerName: "MinIO Path", flex: 1, minWidth: 320 },
                {
                  field: "status",
                  headerName: "Status",
                  width: 130,
                },
                {
                  field: "note",
                  headerName: "Notes",
                  flex: 1,
                  minWidth: 260,
                },
                {
                  field: "__actions",
                  headerName: "Open",
                  width: 110,
                  sortable: false,
                  filterable: false,
                  renderCell: (p: any) => {
                    const r = p.row as DocRow;
                    if (!r.file_path) return "—";
                    return (
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openFile(String(r.file_path))}>
                        Open
                      </AdButton>
                    );
                  },
                },
              ] as any}
              loading={loading}
              disableColumnMenu
            />
          </Stack>
        </AdCard>
      </Stack>
    </Container>
  );
}
