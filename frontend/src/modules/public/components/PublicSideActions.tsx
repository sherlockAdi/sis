import { Box, Button, IconButton, Tooltip } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useNavigate } from "react-router-dom";

export default function PublicSideActions() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: "fixed",
        right: 16,
        bottom: 20,
        zIndex: 1300,
        display: { xs: "none", md: "flex" },
        alignItems: "flex-end",
        gap: 1,
      }}
    >
      <Tooltip title="Back to top">
        <IconButton
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: "secondary.main",
            color: "white",
            border: "1px solid rgba(255,255,255,0.12)",
            "&:hover": { bgcolor: "secondary.dark" },
          }}
        >
          <KeyboardArrowUpIcon />
        </IconButton>
      </Tooltip>

      <Button
        variant="contained"
        onClick={() => navigate("/employer-zone/contact")}
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 1.5,
          px: 1.75,
          py: 1.1,
          transform: "rotate(-90deg)",
          transformOrigin: "right bottom",
          boxShadow: "0 18px 50px rgba(17,24,39,0.22)",
          "&:hover": { bgcolor: "primary.dark" },
        }}
      >
        Get in Touch Now
      </Button>
    </Box>
  );
}
