import { Box } from "@mui/material";
import { SisLogo } from "../ad";

export default function Header() {
  return (
    <Box
      style={{
        background: "#ffffff",
        color: "white",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <SisLogo height={104} />
    </Box>
  );
}
