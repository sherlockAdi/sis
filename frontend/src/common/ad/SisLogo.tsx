import { Box } from "@mui/material";
import bundledLogoUrl from "../../assets/sis-logo.svg?url";

type SisLogoProps = {
  /** Image URL (string). Defaults to a bundled asset. */
  src?: string;
  /** Height in px, default: 34 */
  height?: number;
};

export default function SisLogo({ src = bundledLogoUrl, height = 34 }: SisLogoProps) {
  return (
    <Box
      component="img"
      src={src}
      alt="SIS Group Enterprises"
      sx={{ height, width: "auto", display: "block" }}
    />
  );
}
