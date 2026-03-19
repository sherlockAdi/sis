import { Box } from "@mui/material";

/**
 * Theme backgrounds used across pages.
 */
export type Ad3DBackgroundVariant = "blue" | "ehrm";

type Ad3DBackgroundProps = {
  variant?: Ad3DBackgroundVariant;
};

export default function Ad3DBackground({ variant = "blue" }: Ad3DBackgroundProps) {
  const isEhrm = variant === "ehrm";

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        pointerEvents: "none",
        background: isEhrm
          ? "linear-gradient(90deg, #d81b60 0%, #d81b60 50%, #f6f6f8 50%, #f6f6f8 100%)"
          : "linear-gradient(135deg, #d5efff 0%, #bfe5ff 45%, #a7dcff 70%, #bfe8ff 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: isEhrm
            ? "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.20), transparent 42%), radial-gradient(circle at 25% 85%, rgba(0,0,0,0.14), transparent 52%), radial-gradient(circle at 82% 35%, rgba(0,0,0,0.05), transparent 44%)"
            : "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.38), transparent 44%), radial-gradient(circle at 82% 80%, rgba(0,0,0,0.08), transparent 55%)",
          pointerEvents: "none",
        },
      }}
    >
      <Circle
        size={isEhrm ? 680 : 600}
        top={isEhrm ? "-38%" : "-32%"}
        left={isEhrm ? "-34%" : "-30%"}
        borderColor={isEhrm ? "rgba(255,255,255,0.16)" : "rgba(255, 255, 255, 0)"}
        fill={isEhrm ? "rgba(255,255,255,0.22)" : "rgba(255, 255, 255, 0.45)"}
        delay="0s"
        name="adFloatLeft"
        midShiftX="24%"
        midShiftY="6%"
      />
      <Circle
        size={isEhrm ? 460 : 400}
        top={isEhrm ? "52%" : "48%"}
        left={isEhrm ? "84%" : "88%"}
        borderColor={isEhrm ? "rgba(216,27,96,0.18)" : "rgba(255, 255, 255, 0)"}
        fill={isEhrm ? "rgba(216,27,96,0.16)" : "rgba(255, 255, 255, 0.45)"}
        delay="2s"
        name="adFloatRight"
        midShiftX="-20%"
        midShiftY="-8%"
      />
    </Box>
  );
}

type CircleProps = {
  size: number;
  top: string;
  left: string;
  borderColor: string;
  fill: string;
  delay: string;
  name: string;
  midShiftX: string;
  midShiftY: string;
};

function Circle({
  size,
  top,
  left,
  borderColor,
  fill,
  delay,
  name,
  midShiftX,
  midShiftY,
}: CircleProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `24px solid ${borderColor}`,
        background: fill,
        boxShadow: `0 22px 48px rgba(2, 6, 23, 0.14)`,
        animation: `${name} 9s ease-in-out infinite`,
        animationDelay: delay,
        [`@keyframes ${name}`]: {
          "0%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: `translate3d(${midShiftX}, ${midShiftY}, 0) scale(1.03)` },
          "100%": { transform: "translate3d(0,0,0) scale(1)" },
        },
      }}
    />
  );
}
