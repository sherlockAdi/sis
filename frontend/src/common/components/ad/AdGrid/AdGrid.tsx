import { useEffect, useMemo, useState } from "react";
import type { MutableRefObject } from "react";
import { Box, Button, Divider, Stack } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableViewIcon from "@mui/icons-material/TableView";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  DataGrid,
  type DataGridProps,
  type GridApiCommunity,
  type GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  type GridValidRowModel,
  useGridApiRef,
} from "@mui/x-data-grid";

const ROOT_GROUP_ID = "auto-generated-group-node-root";

export type AdGridProps<Row extends GridValidRowModel = any> = DataGridProps<Row> & {
  /** show built-in toolbar buttons + export actions */
  showToolbar?: boolean;
  /** show Excel/PDF download buttons in the toolbar */
  showExport?: boolean;
  /** base filename used for downloads (without extension) */
  exportFileName?: string;
  /** branding text printed at top of exported PDF */
  pdfBrandingText?: string;
  /** optional PDF title printed under branding */
  pdfTitle?: string;
};

type AdGridToolbarProps = {
  apiRef: MutableRefObject<GridApiCommunity | null>;
  showExport: boolean;
  exportFileName: string;
  pdfBrandingText: string;
  pdfTitle?: string;
};

function sanitizeFileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "grid";
  return trimmed.replace(/[\\/:*?"<>|]+/g, "-");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function isDateLikeColumn(column: GridColDef) {
  const key = `${column.field} ${column.headerName ?? ""}`.toLowerCase();
  return (
    column.type === "date" ||
    column.type === "dateTime" ||
    /\bdob\b/.test(key) ||
    /\bdue\s*date\b/.test(key) ||
    /(^|_)date($|_)/.test(column.field.toLowerCase()) ||
    /_at$/.test(column.field.toLowerCase()) ||
    /expiry|expired/.test(key)
  );
}

function formatDateDdMmYyyy(value: unknown) {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const dd = String(value.getDate()).padStart(2, "0");
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const yyyy = String(value.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  const raw = String(value).trim();
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s.*)?$/);
  if (slashMatch) {
    return `${slashMatch[1].padStart(2, "0")}/${slashMatch[2].padStart(2, "0")}/${slashMatch[3]}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, "0");
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const yyyy = String(parsed.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  return raw;
}

function withDefaultDateFormat<Row extends GridValidRowModel>(columns?: readonly GridColDef<Row>[]) {
  return columns?.map((column) => {
    if (!isDateLikeColumn(column)) return column;
    return {
      ...column,
      valueFormatter: (value: unknown) => formatDateDdMmYyyy(value),
    };
  });
}

function isActionColumn(column: GridColDef) {
  const key = `${column.field} ${column.headerName ?? ""}`.toLowerCase();
  return column.type === "actions" || key.includes("action") || column.field.startsWith("__actions");
}

function appendClassName(existing: GridColDef["cellClassName"], className: string): GridColDef["cellClassName"] {
  if (!existing) return className;
  if (typeof existing === "string") return `${existing} ${className}`;
  return (params) => `${existing(params)} ${className}`.trim();
}

function withStickyActionColumns<Row extends GridValidRowModel>(columns?: readonly GridColDef<Row>[]) {
  if (!columns) return columns;
  const enhanced = columns.map((column) => {
    if (!isActionColumn(column)) return column;
    return {
      ...column,
      sortable: false,
      filterable: false,
      disableExport: true,
      disableColumnMenu: true,
      headerClassName: `${column.headerClassName ?? ""} ad-grid-actions-sticky`.trim(),
      cellClassName: appendClassName(column.cellClassName, "ad-grid-actions-sticky"),
    };
  });

  return [...enhanced.filter((column) => !isActionColumn(column)), ...enhanced.filter(isActionColumn)];
}

function AdGridToolbar({
  apiRef,
  showExport,
  exportFileName,
  pdfBrandingText,
  pdfTitle,
}: AdGridToolbarProps) {
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const getExportColsAndRowIds = () => {
    const api = apiRef.current;
    if (!api) return { columns: [] as GridColDef[], rowIds: [] as any[] };

    const columns = api
      .getVisibleColumns()
      .filter((c) => !c.field.startsWith("__"))
      .filter((c) => !(c as any).disableExport);

    const rowIds =
      typeof (api as any).getRowGroupChildren === "function"
        ? (api as any).getRowGroupChildren({
            groupId: ROOT_GROUP_ID,
            applyFiltering: true,
            applySorting: true,
            skipAutoGeneratedRows: true,
          })
        : (api.getSortedRowIds?.() ?? api.getAllRowIds?.() ?? []).filter(
            (id: any) => (api.getRowIndexRelativeToVisibleRows?.(id) ?? 0) !== -1,
          );

    return { columns, rowIds };
  };

  const downloadExcel = async () => {
    const api = apiRef.current;
    if (!api) return;

    setExporting("excel");
    try {
      const { columns, rowIds } = getExportColsAndRowIds();
      const headers = columns.map((c) => c.headerName ?? c.field);

      const body = rowIds.map((id) => {
        const row = api.getRow(id);
        return columns.map((col) => {
          const val = row ? api.getRowFormattedValue(row, col) : "";
          return val === null || val === undefined ? "" : String(val);
        });
      });

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer | Uint8Array;
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `${sanitizeFileName(exportFileName)}.xlsx`);
    } catch (err) {
      console.error("AdGrid Excel export failed:", err);
      window.alert("Excel download failed. Please check console for details.");
    } finally {
      setExporting(null);
    }
  };

  const downloadPdf = async () => {
    const api = apiRef.current;
    if (!api) return;

    setExporting("pdf");
    try {
      const { columns, rowIds } = getExportColsAndRowIds();
      const headers = columns.map((c) => c.headerName ?? c.field);

      const body = rowIds.map((id) => {
        const row = api.getRow(id);
        return columns.map((col) => {
          const val = row ? api.getRowFormattedValue(row, col) : "";
          return val === null || val === undefined ? "" : String(val);
        });
      });

      const doc = new jsPDF({
        orientation: headers.length > 6 ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const now = new Date();

      doc.setFontSize(18);
      doc.text(pdfBrandingText, pageWidth / 2, 34, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(now.toLocaleString(), pageWidth - 40, 34, { align: "right" });

      let startY = 52;
      if (pdfTitle) {
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(pdfTitle, pageWidth / 2, 54, { align: "center" });
        startY = 70;
      }

      autoTable(doc, {
        startY,
        head: [headers],
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      doc.save(`${sanitizeFileName(exportFileName)}.pdf`);
    } catch (err) {
      console.error("AdGrid PDF export failed:", err);
      window.alert("PDF download failed. Please check console for details.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <GridToolbarContainer>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ width: "100%", p: 1 }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector />

          {showExport && (
            <>
              <Divider orientation="vertical" flexItem />
              <Button
                size="small"
                variant="outlined"
                startIcon={<TableViewIcon />}
                onClick={downloadExcel}
                disabled={exporting !== null}
              >
                Excel
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={downloadPdf}
                disabled={exporting !== null}
              >
                PDF
              </Button>
              <Button
                size="small"
                variant="text"
                startIcon={<FileDownloadIcon />}
                onClick={() => apiRef.current?.exportDataAsCsv?.()}
              >
                CSV
              </Button>
            </>
          )}
        </Stack>

        <Box flex={1} />
        <GridToolbarQuickFilter debounceMs={250} />
      </Stack>
    </GridToolbarContainer>
  );
}

export function AdGrid<Row extends GridValidRowModel = any>({
  disableRowSelectionOnClick = true,
  density = "compact",
  pagination = true,
  hideFooterPagination,
  pageSizeOptions = [10, 25, 50, 100],
  columnBufferPx,
  autoHeight = true,
  sx,
  showToolbar = true,
  showExport = true,
  exportFileName = "SIS-Grid",
  pdfBrandingText = "SIS Global Connect",
  pdfTitle,
  apiRef: apiRefProp,
  slots: slotsProp,
  slotProps: slotPropsProp,
  ...rest
}: AdGridProps<Row>) {
  const internalApiRef = useGridApiRef();
  const apiRef = (apiRefProp ?? internalApiRef) as MutableRefObject<GridApiCommunity | null>;

  const resolvedHideFooterPagination = hideFooterPagination ?? !pagination;
  const resolvedShowExport = showToolbar ? true : showExport;
  const columns = useMemo(() => withStickyActionColumns(withDefaultDateFormat(rest.columns)), [rest.columns]);
  const hasStickyActionColumn = useMemo(() => Boolean(columns?.some(isActionColumn)), [columns]);

  useEffect(() => {
    if (!hasStickyActionColumn) return;
    (apiRef.current as any)?.unstable_setColumnVirtualization?.(false);
  }, [apiRef, hasStickyActionColumn]);

  const slots = useMemo(() => {
    if (!showToolbar) return slotsProp;
    if (slotsProp?.toolbar) return slotsProp;
    return { ...slotsProp, toolbar: AdGridToolbar };
  }, [slotsProp, showToolbar]);

  const slotProps = useMemo(() => {
    if (!showToolbar) return slotPropsProp;
    if (slotsProp?.toolbar) return slotPropsProp;
    return {
      ...slotPropsProp,
      toolbar: {
        apiRef,
        showExport: resolvedShowExport,
        exportFileName,
        pdfBrandingText,
        pdfTitle,
      } satisfies AdGridToolbarProps,
    };
  }, [apiRef, exportFileName, pdfBrandingText, pdfTitle, resolvedShowExport, showToolbar, slotPropsProp, slotsProp?.toolbar]);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        overflow: "hidden",
        backgroundColor: "background.paper",
        height: autoHeight ? "auto" : "100%",
      }}
    >
      <DataGrid
        {...rest}
        showToolbar={showToolbar}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        density={density}
        pagination={pagination}
        hideFooterPagination={resolvedHideFooterPagination}
        pageSizeOptions={pageSizeOptions}
        columnBufferPx={hasStickyActionColumn ? 10000 : columnBufferPx}
        autoHeight={autoHeight}
        columns={columns}
        sx={[
          {
            border: 0,
            height: autoHeight ? undefined : "100%",
            "& .ad-grid-actions-sticky": {
              position: "sticky !important",
              right: "0 !important",
              zIndex: 3,
              backgroundColor: "background.paper",
              borderLeft: "1px solid",
              borderColor: "divider",
              boxShadow: "-8px 0 10px -10px rgba(15, 23, 42, 0.5)",
            },
            "& .MuiDataGrid-columnHeader.ad-grid-actions-sticky": {
              zIndex: 4,
              backgroundColor: "background.paper",
            },
          },
          sx,
        ]}
        apiRef={apiRef}
        slots={slots}
        slotProps={slotProps}
      />
    </Box>
  );
}
