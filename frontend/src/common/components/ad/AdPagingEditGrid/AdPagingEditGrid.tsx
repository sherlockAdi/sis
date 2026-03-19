import { Box } from "@mui/material";
import type { GridPaginationModel, GridValidRowModel } from "@mui/x-data-grid";
import { AdEditGrid, type AdEditGridProps } from "../AdEditGrid";

export type AdPagingEditGridProps<Row extends GridValidRowModel = any> = Omit<
  AdEditGridProps<Row>,
  "autoHeight" | "paginationModel" | "onPaginationModelChange" | "pageSizeOptions"
> & {
  height?: number | string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
};

export function AdPagingEditGrid<Row extends GridValidRowModel = any>({
  height = 420,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  paginationModel,
  onPaginationModelChange,
  initialState,
  ...rest
}: AdPagingEditGridProps<Row>) {
  const resolvedInitialState =
    paginationModel || onPaginationModelChange
      ? initialState
      : {
          ...initialState,
          pagination: {
            paginationModel: { page: 0, pageSize: defaultPageSize },
            ...initialState?.pagination,
          },
        };

  return (
    <Box sx={{ height, width: "100%" }}>
      <AdEditGrid
        {...rest}
        autoHeight={false}
        pagination
        hideFooterPagination={false}
        pageSizeOptions={pageSizeOptions}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        initialState={resolvedInitialState}
      />
    </Box>
  );
}

