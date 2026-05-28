import { useEffect } from "react";

const PROTECTION_CLASS = "sis-screen-protection-active";

function brieflyMaskScreen() {
  document.documentElement.classList.add(PROTECTION_CLASS);
  window.setTimeout(() => {
    document.documentElement.classList.remove(PROTECTION_CLASS);
  }, 1200);
}

export default function ScreenProtection() {
  useEffect(() => {
    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const blockedCtrlKey = event.ctrlKey && ["p", "s", "u"].includes(key);
      const blockedDevToolsKey = key === "f12" || (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key));
      const printScreen = key === "printscreen" || event.code === "PrintScreen";

      if (blockedCtrlKey || blockedDevToolsKey || printScreen) {
        event.preventDefault();
        event.stopPropagation();
        brieflyMaskScreen();
      }

      if (printScreen && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText("").catch(() => undefined);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "printscreen" || event.code === "PrintScreen") {
        event.preventDefault();
        brieflyMaskScreen();
        navigator.clipboard?.writeText?.("").catch(() => undefined);
      }
    };

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
    };
  }, []);

  return null;
}
