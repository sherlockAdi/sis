import { Box } from "@mui/material";

type SisLogoProps = {
  /** Public path, default: /sis-logo.svg */
  src?: string;
  /** Height in px, default: 34 */
  height?: number;
};

export default function SisLogo({ src = "/sis-logo.svg", height = 34 }: SisLogoProps) {
  return (
    <Box
      component="img"
      src={src}
      alt="SIS Group Enterprises"
      sx={{ height, width: "auto", display: "block" }}
    />
  );
}

