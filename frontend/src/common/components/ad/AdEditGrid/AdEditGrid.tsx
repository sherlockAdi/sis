import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  DataGrid,
  type DataGridProps,
  type GridApiCommunity,
  type GridColDef,
  type GridCellParams,
  type GridRowId,
  type GridRowModesModel,
  GridRowModes,
  type GridRowModel,
  type GridRowParams,
  GridActionsCellItem,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  type GridValidRowModel,
  useGridApiRef,
} from "@mui/x-data-grid";
import { Box, Button, Divider, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableViewIcon from "@mui/icons-material/TableView";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const ROOT_GROUP_ID = "auto-generated-group-node-root";

export type AdEditGridProps<Row extends GridValidRowModel = any> = Omit<
  DataGridProps<Row>,
  | "processRowUpdate"
  | "columns"
  | "rows"
  | "onRowModesModelChange"
  | "rowModesModel"
  | "onRowEditStop"
  | "onRowEditStart"
  | "editMode"
> & {
  /** Base columns (without actions column). Set `editable: true` where needed. */
  columns: Array<GridColDef<Row>>;
  /** Initial rows (uncontrolled). */
  initialRows: Array<Row>;
  /** Called whenever the internal rows change (add/edit/delete). */
  onRowsChange?: (rows: Array<Row>) => void;
  /** Provide a new empty row when user clicks Add. */
  createRow?: () => Row;
  /** Optional label for Add button. */
  addLabel?: string;
  /** Disable the built-in actions column. */
  disableActions?: boolean;
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

function defaultId() {
  return `tmp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

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

function withDefaultDateFormat<Row extends GridValidRowModel>(columns: Array<GridColDef<Row>>) {
  return columns.map((column) => {
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

function withStickyActionColumns<Row extends GridValidRowModel>(columns: Array<GridColDef<Row>>) {
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

function DefaultToolbar(props: {
  apiRef: ReturnType<typeof useGridApiRef>;
  onAdd: () => void;
  addLabel: string;
  showExport: boolean;
  exportFileName: string;
  pdfBrandingText: string;
  pdfTitle?: string;
}) {
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const getExportColsAndRowIds = () => {
    const api = props.apiRef.current;
    if (!api) return { columns: [] as GridColDef[], rowIds: [] as GridRowId[] };

    const columns = api
      .getVisibleColumns()
      .filter((c) => !c.field.startsWith("__"))
      .filter((c) => !(c as any).disableExport);

    const rowIds =
      typeof (api as any).getRowGroupChildren === "function"
        ? ((api as any).getRowGroupChildren({
            groupId: ROOT_GROUP_ID,
            applyFiltering: true,
            applySorting: true,
            skipAutoGeneratedRows: true,
          }) as GridRowId[])
        : (api.getSortedRowIds?.() ?? api.getAllRowIds?.() ?? []).filter(
            (id: any) => (api.getRowIndexRelativeToVisibleRows?.(id) ?? 0) !== -1,
          );

    return { columns, rowIds };
  };

  const downloadExcel = async () => {
    const api = props.apiRef.current;
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
      downloadBlob(
        new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `${sanitizeFileName(props.exportFileName)}.xlsx`,
      );
    } finally {
      setExporting(null);
    }
  };

  const downloadPdf = async () => {
    const api = props.apiRef.current;
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
      doc.setFontSize(18);
      doc.text(props.pdfBrandingText, pageWidth / 2, 34, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(new Date().toLocaleString(), pageWidth - 40, 34, { align: "right" });

      let startY = 52;
      if (props.pdfTitle) {
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(props.pdfTitle, pageWidth / 2, 54, { align: "center" });
        startY = 70;
      }

      autoTable(doc, {
        startY,
        head: [headers],
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });
      doc.save(`${sanitizeFileName(props.exportFileName)}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <GridToolbarContainer>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} sx={{ width: "100%", p: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button size="small" startIcon={<AddIcon />} onClick={props.onAdd} variant="outlined">
            {props.addLabel}
          </Button>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector />

          {props.showExport && (
            <>
              <Divider orientation="vertical" flexItem />
              <Button size="small" variant="outlined" startIcon={<TableViewIcon />} onClick={downloadExcel} disabled={exporting !== null}>
                Excel
              </Button>
              <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={downloadPdf} disabled={exporting !== null}>
                PDF
              </Button>
              <Button size="small" variant="text" startIcon={<FileDownloadIcon />} onClick={() => props.apiRef.current?.exportDataAsCsv?.()}>
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

export function AdEditGrid<Row extends GridValidRowModel = any>({
  columns,
  initialRows,
  onRowsChange,
  createRow,
  addLabel = "Add",
  disableActions = false,
  showToolbar = true,
  showExport = true,
  exportFileName = "SIS-Grid",
  pdfBrandingText = "SIS Global Connect",
  pdfTitle,
  density = "compact",
  pagination = false,
  hideFooterPagination,
  pageSizeOptions = [10, 25, 50, 100],
  columnBufferPx,
  disableRowSelectionOnClick = true,
  autoHeight = true,
  ...rest
}: AdEditGridProps<Row>) {
  const apiRef = useGridApiRef();
  const [rows, setRows] = useState<Array<Row>>(initialRows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const resolvedHideFooterPagination = hideFooterPagination ?? !pagination;
  const formattedColumns = useMemo(() => withStickyActionColumns(withDefaultDateFormat(columns)), [columns]);
  const hasStickyActionColumn = useMemo(() => formattedColumns.some(isActionColumn), [formattedColumns]);

  useEffect(() => {
    if (!hasStickyActionColumn) return;
    (apiRef.current as any)?.unstable_setColumnVirtualization?.(false);
  }, [apiRef, hasStickyActionColumn]);

  const updateRows = (next: Array<Row>) => {
    setRows(next);
    onRowsChange?.(next);
  };

  const handleAdd = () => {
    const newRow = (createRow?.() ?? ({ id: defaultId() } as unknown as Row)) as Row;
    if ((newRow as any).id === undefined || (newRow as any).id === null) {
      (newRow as any).id = defaultId();
    }

    const next = [newRow, ...rows];
    updateRows(next);

    setRowModesModel((prev) => ({
      ...prev,
      [(newRow as any).id as GridRowId]: { mode: GridRowModes.Edit, fieldToFocus: columns[0]?.field },
    }));
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.Edit } }));
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.View } }));
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    const next = rows.filter((r) => (r as any).id !== id);
    updateRows(next);
  };

  const processRowUpdate = (newRow: GridRowModel, _oldRow: GridRowModel) => {
    const next = rows.map((r) => ((r as any).id === (newRow as any).id ? (newRow as Row) : r));
    updateRows(next);
    return newRow;
  };

  const mergedColumns = useMemo(() => {
    if (disableActions) return formattedColumns;

    const actionsCol: GridColDef<Row> = {
      field: "__actions__",
      type: "actions",
      headerName: "Actions",
      width: 110,
      headerClassName: "ad-grid-actions-sticky",
      cellClassName: "ad-grid-actions-sticky",
      getActions: (params: GridRowParams<Row>) => {
        const id = params.id;
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem key="save" icon={<SaveIcon />} label="Save" onClick={handleSaveClick(id)} />,
            <GridActionsCellItem key="cancel" icon={<CloseIcon />} label="Cancel" onClick={handleCancelClick(id)} />,
          ];
        }

        return [
          <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={handleEditClick(id)} />,
          <GridActionsCellItem key="delete" icon={<DeleteIcon />} label="Delete" onClick={handleDeleteClick(id)} />,
        ];
      },
    };

    return [...formattedColumns, actionsCol];
  }, [disableActions, formattedColumns, rowModesModel]);

  const editableFields = useMemo(() => {
    return mergedColumns
      .filter((c) => c.field !== "__actions__" && c.type !== "actions")
      .filter((c) => Boolean((c as any).editable))
      .map((c) => c.field);
  }, [mergedColumns]);

  const getVisibleRowIds = useCallback((api: GridApiCommunity) => {
    if (typeof (api as any).getRowGroupChildren === "function") {
      return (api as any).getRowGroupChildren({
        groupId: ROOT_GROUP_ID,
        applyFiltering: true,
        applySorting: true,
        skipAutoGeneratedRows: true,
      }) as GridRowId[];
    }

    const all = api.getSortedRowIds?.() ?? api.getAllRowIds?.() ?? [];
    return all.filter((id: any) => (api.getRowIndexRelativeToVisibleRows?.(id) ?? 0) !== -1);
  }, []);

  const handleCellKeyDown = useCallback(
    (params: GridCellParams<Row>, event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) return;

      const id = params.id;
      const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
      if (!isInEditMode) return;

      if (!editableFields.includes(params.field)) return;

      const api = apiRef.current;
      if (!api) return;

      event.preventDefault();
      event.stopPropagation();

      const currentFieldIndex = editableFields.indexOf(params.field);
      const nextField = editableFields[currentFieldIndex + 1];

      if (nextField) {
        api.setCellFocus(id, nextField);
        return;
      }

      const visibleRowIds = getVisibleRowIds(api);
      const rowIndex = visibleRowIds.findIndex((rid) => rid === id);
      const nextRowId = rowIndex >= 0 ? visibleRowIds[rowIndex + 1] : undefined;
      if (!nextRowId) return;

      const firstField = editableFields[0];
      if (!firstField) return;
      setRowModesModel((prev) => ({
        ...prev,
        [nextRowId]: { mode: GridRowModes.Edit, fieldToFocus: firstField },
      }));
      api.setCellFocus(nextRowId, firstField);
    },
    [apiRef, editableFields, getVisibleRowIds, rowModesModel],
  );

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        overflow: "hidden",
        backgroundColor: "background.paper",
      }}
    >
      <DataGrid<Row>
        {...rest}
        apiRef={apiRef}
        autoHeight={autoHeight}
        density={density}
        pagination={pagination}
        hideFooterPagination={resolvedHideFooterPagination}
        rows={rows}
        columns={mergedColumns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={setRowModesModel}
        processRowUpdate={processRowUpdate}
        onCellKeyDown={handleCellKeyDown}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        pageSizeOptions={pageSizeOptions}
        columnBufferPx={hasStickyActionColumn ? 10000 : columnBufferPx}
        showToolbar={showToolbar}
        sx={[
          {
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
          rest.sx,
        ]}
        slots={{
          ...(showToolbar
            ? {
                toolbar: () => (
                  <DefaultToolbar
                    apiRef={apiRef}
                    onAdd={handleAdd}
                    addLabel={addLabel}
                    showExport={showExport}
                    exportFileName={exportFileName}
                    pdfBrandingText={pdfBrandingText}
                    pdfTitle={pdfTitle}
                  />
                ),
              }
            : {}),
          ...rest.slots,
        }}
      />
    </Box>
  );
}
