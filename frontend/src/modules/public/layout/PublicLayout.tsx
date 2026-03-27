import { useEffect } from "react";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Outlet, useLocation } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import { publicTheme } from "../publicTheme";
import PublicSideActions from "../components/PublicSideActions";

export default function PublicLayout() {
  const location = useLocation();
  const hideChrome = location.pathname === "/menu";

  useEffect(() => {
    if (hideChrome) return;
    const raw = String(location.hash ?? "").trim();
    if (raw && raw.startsWith("#") && raw.length > 1) {
      const id = decodeURIComponent(raw.slice(1));
      // Wait a tick so the route content mounts before scrolling.
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [hideChrome, location.hash, location.pathname]);

  return (
    <ThemeProvider theme={publicTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        {hideChrome ? null : <PublicHeader />}
        <Outlet />
        {hideChrome ? null : <PublicFooter />}
        {hideChrome ? null : <PublicSideActions />}
      </Box>
    </ThemeProvider>
  );
}
