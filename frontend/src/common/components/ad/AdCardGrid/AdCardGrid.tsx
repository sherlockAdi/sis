import { Children } from "react";
import type { ReactNode } from "react";
import { Grid } from "@mui/material";

export type AdCardGridProps = {
  children?: ReactNode;
  spacing?: number;
  /** Default size applied to each child card. */
  itemSize?: any;
};

export function AdCardGrid({ children, spacing = 2, itemSize = { xs: 12, md: 6 } }: AdCardGridProps) {
  const items = Children.toArray(children);

  return (
    <Grid container spacing={spacing}>
      {items.map((child, idx) => (
        <Grid key={idx} size={itemSize}>
          {child}
        </Grid>
      ))}
    </Grid>
  );
}

