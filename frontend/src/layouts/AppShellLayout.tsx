import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FolderIcon from "@mui/icons-material/Folder";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import CategoryIcon from "@mui/icons-material/Category";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DescriptionIcon from "@mui/icons-material/Description";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import BadgeIcon from "@mui/icons-material/Badge";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import BusinessIcon from "@mui/icons-material/Business";
import { AdAppShell, AdButton } from "../common/ad";
import { useAuth } from "../common/auth/AuthContext";
import { clearAuthToken } from "../common/services/tokenStorage";
import { withPortalBase } from "../common/paths";

function safePath(path?: string | null): string | null {
  if (!path) return null;
  const p = path.trim();
  if (!p) return null;
  const normalized = p.startsWith("/") ? p : `/${p}`;
  return withPortalBase(normalized);
}

function iconFromDb(name?: string | null) {
  const key = String(name ?? "").trim().toLowerCase();
  switch (key) {
    case "dashboard":
      return <DashboardIcon fontSize="small" />;
    case "menu_book":
      return <MenuBookIcon fontSize="small" />;
    case "public":
      return <PublicIcon fontSize="small" />;
    case "map":
      return <MapIcon fontSize="small" />;
    case "location_city":
      return <LocationCityIcon fontSize="small" />;
    case "location_on":
      return <LocationOnIcon fontSize="small" />;
    case "people":
      return <PeopleAltIcon fontSize="small" />;
    case "video_call":
      return <VideoCallIcon fontSize="small" />;
    case "badge":
      return <BadgeIcon fontSize="small" />;
    case "work":
      return <WorkOutlineIcon fontSize="small" />;
    case "category":
      return <CategoryIcon fontSize="small" />;
    case "schedule":
      return <ScheduleIcon fontSize="small" />;
    case "receipt_long":
      return <ReceiptLongIcon fontSize="small" />;
    case "description":
      return <DescriptionIcon fontSize="small" />;
    case "payments":
      return <PaymentsIcon fontSize="small" />;
    case "settings":
      return <SettingsIcon fontSize="small" />;
    case "business":
      return <BusinessIcon fontSize="small" />;
    default:
      return <FolderIcon fontSize="small" />;
  }
}

export default function AppShellLayout() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useMemo(() => {
    const menus = (me?.menus ?? []).filter((m) => Number(m.can_view) === 1).slice();
    menus.sort((a, b) => Number(a.menu_order) - Number(b.menu_order));

    const byParent = new Map<number | null, any[]>();
    for (const m of menus) {
      const key = m.parent_menu_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(m);
    }

    const roots = byParent.get(null) ?? [];

    const items: { label: string; to: string; icon: any; children?: any[] }[] = [];
    for (const r of roots) {
      const children = byParent.get(r.menu_id) ?? [];
      const targetPath =
        safePath(r.menu_path) ??
        safePath(children[0]?.menu_path) ??
        withPortalBase("/dashboard");

      items.push({
        label: r.menu_name,
        to: targetPath,
        icon: iconFromDb(r.icon) ?? <FolderIcon fontSize="small" />,
        children: children
          .map((c) => {
            const childPath = safePath(c.menu_path);
            if (!childPath) return null;
            return {
              label: c.menu_name,
              to: childPath,
              icon: iconFromDb(c.icon),
            };
          })
          .filter(Boolean),
      });
    }

    // De-dupe by `to`
    const seen = new Set<string>();
    return items.filter((i) => {
      if (seen.has(i.to)) return false;
      seen.add(i.to);
      return true;
    });
  }, [me?.menus]);

  const rightSlot = useMemo(
    () => (
      <AdButton
        variant="text"
        startIcon={<LogoutIcon />}
        onClick={() => {
          clearAuthToken();
          navigate(withPortalBase("/login"), { replace: true });
        }}
      >
        Logout
      </AdButton>
    ),
    [navigate],
  );

  return (
    <AdAppShell
      title="Administrator Dashboard"
      // subtitle="Recruitment, Deployment & Governance Overview"
      brand="SIS Global"
      navItems={navItems}
      rightSlot={rightSlot}
      currentPath={location.pathname}
      userName={me?.username ?? "User"}
      userEmail={me?.email ?? ""}
    >
      <Outlet />
    </AdAppShell>
  );
}
