import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FolderIcon from "@mui/icons-material/Folder";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import ArticleIcon from "@mui/icons-material/Article";
import CategoryIcon from "@mui/icons-material/Category";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DescriptionIcon from "@mui/icons-material/Description";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InfoIcon from "@mui/icons-material/Info";
import PaymentsIcon from "@mui/icons-material/Payments";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import BadgeIcon from "@mui/icons-material/Badge";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import BusinessIcon from "@mui/icons-material/Business";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { BottomNavigation, BottomNavigationAction, Box, IconButton, InputAdornment, Stack, TextField, useMediaQuery, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
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
    case "school":
      return <MenuBookIcon fontSize="small" />;
    case "handyman":
      return <SettingsIcon fontSize="small" />;
    case "fact_check":
      return <BadgeIcon fontSize="small" />;
    case "smart_toy":
      return <FolderIcon fontSize="small" />;
    case "add":
      return <PeopleAltIcon fontSize="small" />;
    default:
      return <FolderIcon fontSize="small" />;
  }
}

export default function AppShellLayout() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const role = String(me?.role_code ?? "").toUpperCase();
  const isCandidate = role === "CANDIDATE";
  const isPartner = role === "SOURCING" || role === "PARTNER";
  const isEmployer = role === "EMPLOYER" || role === "CUSTOMER";
  const isAdminLike = !(isCandidate || isPartner || isEmployer);

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
        code: r.menu_code,
        to: targetPath,
        icon: iconFromDb(r.icon) ?? <FolderIcon fontSize="small" />,
        children: children
          .map((c) => {
            const childPath = safePath(c.menu_path);
            if (!childPath) return null;
            return {
              label: c.menu_name,
              code: c.menu_code,
              to: childPath,
              icon: iconFromDb(c.icon),
            };
          })
          .filter(Boolean),
      });
    }

    // De-dupe by menu code so distinct groups can share the same landing route.
    const seen = new Set<string>();
    return items.filter((i) => {
      const key = String(i.code ?? i.to);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [me?.menus]);

  const candidateNavSections = useMemo(() => {
    if (!isCandidate) return null;

    return [
      {
        heading: "MAIN MENU",
        items: [
          {
            label: "Dashboard",
            to: withPortalBase("/candidate/home"),
            icon: <HomeIcon fontSize="small" />,
          },
        ],
      },
      {
        heading: "PROFILE",
        items: [
          {
            label: "Profile",
            to: withPortalBase("/candidate/profile"),
            icon: <PersonIcon fontSize="small" />,
            children: [
              { label: "Personal Info", to: withPortalBase("/candidate/profile/settings"), icon: <BadgeIcon fontSize="small" /> },
              { label: "Upload Documents", to: withPortalBase("/candidate/profile/documents"), icon: <ArticleIcon fontSize="small" /> },
              { label: "Upload Trade Video", to: withPortalBase("/candidate/profile/trade-test"), icon: <VideoCallIcon fontSize="small" /> },
            ],
          },
        ],
      },
      {
        heading: "JOBS",
        items: [
          {
            label: "Jobs",
            to: withPortalBase("/candidate/jobs"),
            icon: <WorkOutlineIcon fontSize="small" />,
            children: [
              { label: "Job List", to: withPortalBase("/candidate/jobs"), icon: <WorkOutlineIcon fontSize="small" /> },
              { label: "View Applied Jobs", to: withPortalBase("/candidate/applications"), icon: <DescriptionIcon fontSize="small" /> },
              { label: "View Job Status", to: withPortalBase("/candidate/profile/deployment"), icon: <ScheduleIcon fontSize="small" /> },
            ],
          },
        ],
      },
      {
        heading: "ONBOARDING PROCESS",
        items: [
          {
            label: "Onboarding",
            to: withPortalBase("/candidate/onboarding/offer"),
            icon: <MenuBookOutlinedIcon fontSize="small" />,
            children: [
              { label: "Download Offer", to: withPortalBase("/candidate/onboarding/offer"), icon: <ReceiptLongIcon fontSize="small" /> },
              { label: "Visa Details", to: withPortalBase("/candidate/onboarding/visa-details"), icon: <DescriptionIcon fontSize="small" /> },
              { label: "Download Tickets", to: withPortalBase("/candidate/onboarding/tickets"), icon: <ReceiptLongIcon fontSize="small" /> },
            ],
          },
        ],
      },
      {
        heading: "ACCOUNTS",
        items: [
          {
            label: "Accounts",
            to: withPortalBase("/candidate/accounts/payments"),
            icon: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
            children: [
              { label: "Payments", to: withPortalBase("/candidate/accounts/payments"), icon: <PaymentsIcon fontSize="small" /> },
              { label: "Download Receipts", to: withPortalBase("/candidate/accounts/receipts"), icon: <ReceiptLongIcon fontSize="small" /> },
            ],
          },
        ],
      },
      {
        heading: "HELPDESK",
        items: [
          {
            label: "Helpdesk",
            to: withPortalBase("/candidate/profile/helpdesk"),
            icon: <ReceiptLongIcon fontSize="small" />,
            children: [
              { label: "Open Ticket/ View ticket", to: withPortalBase("/candidate/profile/helpdesk/open-ticket"), icon: <ReceiptLongIcon fontSize="small" /> },
              { label: "Ticket Status", to: withPortalBase("/candidate/profile/helpdesk/ticket-status"), icon: <InfoIcon fontSize="small" /> },
            ],
          },
        ],
      },
      {
        heading: "SETTINGS",
        items: [
          {
            label: "Settings",
            to: withPortalBase("/candidate/profile/settings"),
            icon: <SettingsIcon fontSize="small" />,
            children: [
              { label: "Change Password", to: withPortalBase("/candidate/profile/settings"), icon: <SettingsOutlinedIcon fontSize="small" /> },
            ],
          },
        ],
      },
    ];
  }, [isCandidate]);

  const navSections = useMemo(() => {
    if (!isAdminLike) return null;

    const MAIN = "MAIN MENU";
    const SETTINGS = "SYSTEM SETTINGS";
    const EMPLOYER = "EMPLOYER";
    const ASSOCIATE = "ASSOCIATE PARTNERS";
    const CANDIDATE_DEV = "CANDIDATE DEVELOPMENT ZONE";
    const EMPLOYEE = "EMPLOYEE ZONE";
    const ATTENDANCE = "ATTENDANCE RULE";
    const HELPDESK = "TICKETING & HELPDESK";
    const ADMIN = "ADMINISTRATION";

    const assignableCodes = new Map<string, string>([
      ["ADM_SETTINGS", SETTINGS],
      ["ADM_EMPLOYER", EMPLOYER],
      ["ADM_ASSOC_PARTNERS", ASSOCIATE],
      ["ADM_CAND_DEV_ZONE", CANDIDATE_DEV],
      ["ADM_EMPLOYEE_ZONE", EMPLOYEE],
      ["ADM_ATTENDANCE", ATTENDANCE],
      ["ADM_HELPDESK", HELPDESK],
    ]);

    const buckets: Record<string, any[]> = {
      [MAIN]: [],
      [SETTINGS]: [],
      [EMPLOYER]: [],
      [ASSOCIATE]: [],
      [CANDIDATE_DEV]: [],
      [EMPLOYEE]: [],
      [ATTENDANCE]: [],
      [HELPDESK]: [],
      [ADMIN]: [],
    };

    for (const i of navItems as any[]) {
      const code = String(i.code ?? "");
      const bucket = assignableCodes.get(code) ?? ADMIN;
      if (code === "ADM_DASHBOARD") buckets[MAIN].push(i);
      else buckets[bucket].push(i);
    }

    return [
      { heading: MAIN, items: buckets[MAIN] },
      { heading: SETTINGS, items: buckets[SETTINGS] },
      { heading: EMPLOYER, items: buckets[EMPLOYER] },
      { heading: ASSOCIATE, items: buckets[ASSOCIATE] },
      { heading: CANDIDATE_DEV, items: buckets[CANDIDATE_DEV] },
      { heading: EMPLOYEE, items: buckets[EMPLOYEE] },
      { heading: ATTENDANCE, items: buckets[ATTENDANCE] },
      { heading: HELPDESK, items: buckets[HELPDESK] },
      { heading: ADMIN, items: buckets[ADMIN] },
    ].filter((s) => s.items.length);
  }, [isAdminLike, navItems]);

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

  const candidateBottomNav = useMemo(() => {
    if (!isCandidate || isMdUp) return null;

    const path = location.pathname;
    const value =
      path.includes("/candidate/jobs") ? "jobs" :
      path.includes("/candidate/applications") ? "applications" :
      path.includes("/candidate/training") ? "training" :
      path.includes("/candidate/profile") ? "profile" :
      "home";

    return (
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_e, v) => {
          switch (v) {
            case "home":
              navigate(withPortalBase("/candidate/home"));
              break;
            case "jobs":
              navigate(withPortalBase("/candidate/jobs"));
              break;
            case "applications":
              navigate(withPortalBase("/candidate/applications"));
              break;
            case "training":
              navigate(withPortalBase("/candidate/training"));
              break;
            case "profile":
              navigate(withPortalBase("/candidate/profile"));
              break;
            default:
              break;
          }
        }}
        sx={{
          borderTop: "1px solid rgba(2,6,23,0.10)",
          bgcolor: "background.paper",
          "& .MuiBottomNavigationAction-root": { minWidth: 64 },
          "& .MuiBottomNavigationAction-label": { fontWeight: 800 },
          "& .Mui-selected": { color: "primary.main" },
        }}
      >
        <BottomNavigationAction label="Home" value="home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Jobs" value="jobs" icon={<WorkOutlineIcon />} />
        <BottomNavigationAction label="Applications" value="applications" icon={<DescriptionIcon />} />
        <BottomNavigationAction label="Training" value="training" icon={<MenuBookOutlinedIcon />} />
        <BottomNavigationAction label="Profile" value="profile" icon={<PersonIcon />} />
      </BottomNavigation>
    );
  }, [isCandidate, isMdUp, location.pathname, navigate]);

  const partnerBottomNav = useMemo(() => {
    if (!isPartner || isMdUp) return null;

    const path = location.pathname;
    const value =
      path.includes("/partner/job-mandates") ? "jobs" :
      path.includes("/partner/my-submissions") ? "applied" :
      path.includes("/partner/reports") ? "reports" :
      path.includes("/partner/profile") ? "profile" :
      "dashboard";

    return (
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_e, v) => {
          switch (v) {
            case "dashboard":
              navigate(withPortalBase("/partner/dashboard"));
              break;
            case "jobs":
              navigate(withPortalBase("/partner/job-mandates"));
              break;
            case "applied":
              navigate(withPortalBase("/partner/my-submissions"));
              break;
            case "reports":
              navigate(withPortalBase("/partner/reports"));
              break;
            case "profile":
              navigate(withPortalBase("/partner/profile"));
              break;
            default:
              break;
          }
        }}
        sx={{
          borderTop: "1px solid rgba(2,6,23,0.10)",
          bgcolor: "background.paper",
          "& .MuiBottomNavigationAction-root": { minWidth: 64 },
          "& .MuiBottomNavigationAction-label": { fontWeight: 800 },
          "& .Mui-selected": { color: "primary.main" },
        }}
      >
        <BottomNavigationAction label="Dashboard" value="dashboard" icon={<HomeIcon />} />
        <BottomNavigationAction label="Job" value="jobs" icon={<WorkOutlineIcon />} />
        <BottomNavigationAction label="Applied" value="applied" icon={<ReceiptLongIcon />} />
        <BottomNavigationAction label="Reports" value="reports" icon={<DescriptionIcon />} />
        <BottomNavigationAction label="Profile" value="profile" icon={<PersonIcon />} />
      </BottomNavigation>
    );
  }, [isMdUp, isPartner, location.pathname, navigate]);

  const effectiveTitle = useMemo(() => {
    if (isCandidate) return "Candidate Portal";
    if (isPartner) return "Employer Portal";
    if (isEmployer) return "Employer Portal";
    return "Administrator Dashboard";
  }, [isCandidate, isEmployer, isPartner]);

  const effectiveRightSlot = useMemo(() => {
    if (!isCandidate) return rightSlot;
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton
          aria-label="notifications"
          onClick={() => navigate(withPortalBase("/candidate/applications"))}
          size="small"
        >
          <NotificationsNoneIcon />
        </IconButton>
        <IconButton
          aria-label="profile"
          onClick={() => navigate(withPortalBase("/candidate/profile"))}
          size="small"
        >
          <PersonIcon />
        </IconButton>
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
      </Stack>
    );
  }, [isCandidate, navigate, rightSlot]);

  const partnerRightSlot = useMemo(() => {
    if (!isPartner) return effectiveRightSlot;
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton aria-label="wallet" onClick={() => navigate(withPortalBase("/partner/earnings"))} size="small">
          <AccountBalanceWalletOutlinedIcon />
        </IconButton>
        <IconButton aria-label="notifications" size="small">
          <NotificationsNoneIcon />
        </IconButton>
        <IconButton aria-label="profile" onClick={() => navigate(withPortalBase("/partner/profile"))} size="small">
          <PersonIcon />
        </IconButton>
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
      </Stack>
    );
  }, [effectiveRightSlot, isPartner, navigate]);

  const adminTopSearch = useMemo(() => {
    if (!isAdminLike) return null;
    return (
      <Box sx={{ px: 2 }}>
        <TextField
          size="small"
          placeholder="Search candidates / jobs / ID"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 520,
            "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: "rgba(2,6,23,0.03)" },
          }}
        />
      </Box>
    );
  }, [isAdminLike]);

  const adminRightSlot = useMemo(() => {
    if (!isAdminLike) return effectiveRightSlot;
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton aria-label="settings" onClick={() => navigate(withPortalBase("/admin/menu-management"))} size="small">
          <SettingsOutlinedIcon />
        </IconButton>
        <IconButton aria-label="notifications" size="small">
          <NotificationsNoneIcon />
        </IconButton>
        <IconButton aria-label="profile" size="small">
          <PersonIcon />
        </IconButton>
        {rightSlot}
      </Stack>
    );
  }, [effectiveRightSlot, isAdminLike, navigate, rightSlot]);

  return (
    <AdAppShell
      title={effectiveTitle}
      // subtitle="Recruitment, Deployment & Governance Overview"
      brand="SIS Global Workforce Solutions"
      navItems={navItems}
      navSections={candidateNavSections ?? navSections}
      topBarCenter={adminTopSearch}
      rightSlot={isAdminLike ? adminRightSlot : isPartner ? partnerRightSlot : effectiveRightSlot}
      bottomNav={candidateBottomNav ?? partnerBottomNav}
      disableMobileDrawer={isCandidate || isPartner}
      currentPath={location.pathname}
      userName={me?.username ?? "User"}
      userEmail={me?.email ?? ""}
    >
      <Outlet />
    </AdAppShell>
  );
}
