import { Box } from "@mui/material";

type SisLogoProps = {
  /** Public path, default: `${import.meta.env.BASE_URL}sis-logo.svg` */
  src?: string;
  /** Height in px, default: 34 */
  height?: number;
};

function defaultLogoSrc() {
  const base = (import.meta as any).env?.BASE_URL ?? "/";
  const normalized = typeof base === "string" && base.length ? base : "/";
  return normalized.endsWith("/") ? `${normalized}sis-logo.svg` : `${normalized}/sis-logo.svg`;
}

export default function SisLogo({ src = defaultLogoSrc(), height = 34 }: SisLogoProps) {
  return (
    <Box
      component="img"
      src={src}
      alt="SIS Group Enterprises"
      sx={{ height, width: "auto", display: "block" }}
    />
  );
}
