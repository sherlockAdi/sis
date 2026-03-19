import { useCallback, useMemo, useState } from "react";
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
  GridToolbarContainer,
  type GridValidRowModel,
  useGridApiRef,
} from "@mui/x-data-grid";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

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
};

function defaultId() {
  return `tmp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function DefaultToolbar(props: { onAdd: () => void; addLabel: string }) {
  return (
    <GridToolbarContainer sx={{ p: 1 }}>
      <Button size="small" startIcon={<AddIcon />} onClick={props.onAdd} variant="outlined">
        {props.addLabel}
      </Button>
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
  density = "compact",
  pagination = false,
  hideFooterPagination,
  pageSizeOptions = [10, 25, 50, 100],
  disableRowSelectionOnClick = true,
  autoHeight = true,
  ...rest
}: AdEditGridProps<Row>) {
  const apiRef = useGridApiRef();
  const [rows, setRows] = useState<Array<Row>>(initialRows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const resolvedHideFooterPagination = hideFooterPagination ?? !pagination;

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
    if (disableActions) return columns;

    const actionsCol: GridColDef<Row> = {
      field: "__actions__",
      type: "actions",
      headerName: "Actions",
      width: 110,
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

    return [...columns, actionsCol];
  }, [columns, disableActions, rowModesModel]);

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
        slots={{
          toolbar: () => <DefaultToolbar onAdd={handleAdd} addLabel={addLabel} />,
          ...rest.slots,
        }}
      />
    </Box>
  );
}
