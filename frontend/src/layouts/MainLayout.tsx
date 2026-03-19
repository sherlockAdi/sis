import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "transparent" }}>
      <Outlet />
    </Box>
  );
}
