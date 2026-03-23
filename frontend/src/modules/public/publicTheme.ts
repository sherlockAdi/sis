import { createTheme } from "@mui/material/styles";

// Theme inspired by SIS India site (red/white/charcoal)
export const publicTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#c62828", dark: "#8e1b1b", contrastText: "#ffffff" },
    secondary: { main: "#212121" },
    background: { default: "#f6f6f8", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#4b5563" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 900,
        },
      },
    },
  },
});

