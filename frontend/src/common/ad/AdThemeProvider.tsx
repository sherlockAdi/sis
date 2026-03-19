import { type PropsWithChildren, useMemo } from "react";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material";

/**
 * Shared theme wrapper for the AD toolkit.
 * - Centralizes palette/typography so OPD/IPD stay consistent.
 * - Uses responsive fonts to stay legible on mobile.
 */
export default function AdThemeProvider({ children }: PropsWithChildren) {
  const theme = useMemo(() => {
    const base = createTheme({
      palette: {
        mode: "light",
        primary: { main: "#1976d2" },
        secondary: { main: "#00695c" },
        background: { default: "#f7f9fc" },
      },
      shape: { borderRadius: 10 },
      components: {
        MuiButton: {
          styleOverrides: { root: { textTransform: "none", borderRadius: 10 } },
        },
        MuiCard: {
          styleOverrides: { root: { borderRadius: 12 } },
        },
      },
    });

    return responsiveFontSizes(base);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
