import { createTheme } from "@mui/material/styles";

// Theme inspired by SIS India site (red/white/charcoal)
export const publicTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#b71f34", dark: "#861628", contrastText: "#ffffff" },
    secondary: { main: "#111827" },
    background: { default: "#f6f1eb", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#4b5563" },
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily:
      '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 },
    h2: { fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 },
    h3: { fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 },
    h4: { fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 },
    h5: { fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 },
    h6: { fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 700 },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.06)",
    "0 10px 30px rgba(15, 23, 42, 0.10)",
    ...Array(22).fill("0 16px 48px rgba(15, 23, 42, 0.12)"),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at top left, rgba(183, 31, 52, 0.08), transparent 28%), radial-gradient(circle at top right, rgba(17, 24, 39, 0.06), transparent 32%)",
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: "none",
          fontWeight: 900,
          letterSpacing: 0.1,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 900,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
        },
      },
    },
  },
});
