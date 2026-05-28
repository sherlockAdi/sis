import * as React from "react";
import { styled, useTheme, type Theme, type CSSObject } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
import Collapse from "@mui/material/Collapse";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink, useLocation } from "react-router-dom";
import SisLogo from "./SisLogo";

export type NavItem = {
  label: string;
  to: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  /** Optional code from DB to support grouping/logic. */
  code?: string | null;
};

export type NavSection = {
  heading: string;
  items: NavItem[];
};

type AdAppShellProps = {
  title?: string;
  subtitle?: string;
  brand?: string;
  navItems: NavItem[];
  /** Optional sectioned menu (renders headings like "MAIN MENU", "HRM", etc.) */
  navSections?: NavSection[] | null;
  rightSlot?: React.ReactNode;
  /** Optional fixed bottom navigation (mobile-first candidate UX). */
  bottomNav?: React.ReactNode;
  /** Disable the modal drawer on mobile (use with bottomNav). */
  disableMobileDrawer?: boolean;
  /** Optional center content in the top bar (e.g. global search). */
  topBarCenter?: React.ReactNode;
  children: React.ReactNode;
  /** Optional current path for selected styling; defaults to router location. */
  currentPath?: string;
  /** Optional user info displayed in the drawer footer. */
  userName?: string;
  role?: string;
  userEmail?: string;

  /** Optional footer action; defaults to no-op. */
  onSettingsClick?: () => void;
};

const drawerWidth = 300;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== "open" })<AppBarProps>(
  ({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    variants: [
      {
        props: ({ open }) => open,
        style: {
          marginLeft: drawerWidth,
          width: `calc(100% - ${drawerWidth}px)`,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      },
    ],
  }),
);

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

function sidebarPalette(role?: string) {
  const normalized = String(role ?? "").trim().toUpperCase();

  if (normalized === "CANDIDATE") {
    return {
      bg: "#eff6ff",
      gradient: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)",
      border: "rgba(37, 99, 235, 0.16)",
      selectedBg: "rgba(37, 99, 235, 0.14)",
      selectedHoverBg: "rgba(37, 99, 235, 0.18)",
      childSelectedBg: "rgba(14, 165, 233, 0.14)",
      accent: "#2563eb",
      childAccent: "#0284c7",
      hoverBg: "rgba(37, 99, 235, 0.08)",
      heading: "rgba(30, 64, 175, 0.62)",
      icon: "rgba(30, 64, 175, 0.78)",
    };
  }

  if (normalized === "SOURCING" || normalized === "PARTNER") {
    return {
      bg: "#fff7ed",
      gradient: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
      border: "rgba(234, 88, 12, 0.16)",
      selectedBg: "rgba(234, 88, 12, 0.14)",
      selectedHoverBg: "rgba(234, 88, 12, 0.18)",
      childSelectedBg: "rgba(245, 158, 11, 0.14)",
      accent: "#ea580c",
      childAccent: "#d97706",
      hoverBg: "rgba(234, 88, 12, 0.08)",
      heading: "rgba(154, 52, 18, 0.62)",
      icon: "rgba(154, 52, 18, 0.78)",
    };
  }

  if (normalized === "ASSOCIATE") {
    return {
      bg: "#f5f3ff",
      gradient: "linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)",
      border: "rgba(124, 58, 237, 0.16)",
      selectedBg: "rgba(124, 58, 237, 0.14)",
      selectedHoverBg: "rgba(124, 58, 237, 0.18)",
      childSelectedBg: "rgba(139, 92, 246, 0.14)",
      accent: "#7c3aed",
      childAccent: "#8b5cf6",
      hoverBg: "rgba(124, 58, 237, 0.08)",
      heading: "rgba(91, 33, 182, 0.62)",
      icon: "rgba(91, 33, 182, 0.78)",
    };
  }

  if (normalized === "EMPLOYER" || normalized === "CUSTOMER") {
    return {
      bg: "#ecfdf5",
      gradient: "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)",
      border: "rgba(5, 150, 105, 0.16)",
      selectedBg: "rgba(5, 150, 105, 0.14)",
      selectedHoverBg: "rgba(5, 150, 105, 0.18)",
      childSelectedBg: "rgba(16, 185, 129, 0.14)",
      accent: "#059669",
      childAccent: "#10b981",
      hoverBg: "rgba(5, 150, 105, 0.08)",
      heading: "rgba(6, 95, 70, 0.62)",
      icon: "rgba(6, 95, 70, 0.78)",
    };
  }

  if (normalized === "EMPLOYEE") {
    return {
      bg: "#f0fdfa",
      gradient: "linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%)",
      border: "rgba(13, 148, 136, 0.16)",
      selectedBg: "rgba(13, 148, 136, 0.14)",
      selectedHoverBg: "rgba(13, 148, 136, 0.18)",
      childSelectedBg: "rgba(20, 184, 166, 0.14)",
      accent: "#0d9488",
      childAccent: "#14b8a6",
      hoverBg: "rgba(13, 148, 136, 0.08)",
      heading: "rgba(17, 94, 89, 0.62)",
      icon: "rgba(17, 94, 89, 0.78)",
    };
  }

  return {
    bg: "#fff1f2",
    gradient: "linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)",
    border: "rgba(225, 29, 72, 0.16)",
    selectedBg: "rgba(225, 29, 72, 0.14)",
    selectedHoverBg: "rgba(225, 29, 72, 0.18)",
    childSelectedBg: "rgba(59, 130, 246, 0.14)",
    accent: "#e11d48",
    childAccent: "#3b82f6",
    hoverBg: "rgba(225, 29, 72, 0.08)",
    heading: "rgba(159, 18, 57, 0.62)",
    icon: "rgba(159, 18, 57, 0.78)",
  };
}

export default function AdAppShell({
  title = "SIS Global Workforce Solutions",
  // subtitle = "Enterprise Human Resource Management",
  navItems,
  navSections,
  rightSlot,
  bottomNav,
  disableMobileDrawer = false,
  topBarCenter,
  children,
  currentPath,
  userName,
  role,
  userEmail,
  onSettingsClick,
}: AdAppShellProps) {
  const theme = useTheme();
  const location = useLocation();
  const activePath = currentPath ?? location.pathname;
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [open, setOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const palette = React.useMemo(() => sidebarPalette(role), [role]);

  const effectiveOpen = isMdUp ? open : mobileOpen;
  const fallbackIcon = <DashboardIcon fontSize="small" />;
  const twoLineClamp = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as const;

  const isSelected = React.useCallback(
    (item: NavItem): boolean => {
      if (activePath === item.to) return true;
      return Boolean(item.children?.some((c) => activePath === c.to));
    },
    [activePath],
  );

  const handleDrawerOpen = () => {
    if (isMdUp) setOpen(true);
    else setMobileOpen(true);
  };

  const handleDrawerClose = () => {
    if (isMdUp) setOpen(false);
    else setMobileOpen(false);
  };

  const settingsHandler = onSettingsClick ?? (() => {});

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: palette.bg,
        background: palette.gradient,
        borderRight: `1px solid ${palette.border}`,
      }}
    >
      <DrawerHeader sx={{ justifyContent: effectiveOpen ? "space-between" : "center", px: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          {/* <Box sx={{ display: "flex", alignItems: "center" }}>
            <SisLogo height={80} />
          </Box> */}
          <Typography
            variant="caption"
            sx={{ display: effectiveOpen ? "block" : "none", fontWeight: 800, color: palette.heading }}
          >
            {title}
          </Typography>

        </Stack>

        {isMdUp && effectiveOpen && (
          <IconButton onClick={handleDrawerClose} aria-label="collapse sidebar">
            {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </DrawerHeader>

      <Divider />

      <Box sx={{ px: effectiveOpen ? 2 : 1, py: 1.5 }}>
       
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: effectiveOpen ? "block" : "none" }}
        >
          {/* {subtitle} */}
        </Typography>
      </Box>

      <Box sx={{ px: effectiveOpen ? 2 : 1, pb: 1, display: effectiveOpen ? "block" : "none" }}>
        {!navSections?.length ? (
          <Typography
            variant="overline"
            sx={{ fontWeight: 900, color: palette.heading, letterSpacing: 1.2 }}
          >
            Main Menu
          </Typography>
        ) : null}
      </Box>

      <List sx={{ px: 1 }}>
        {(navSections?.length ? navSections : [{ heading: "MAIN MENU", items: navItems }]).map((section) => (
          <Box key={section.heading} sx={{ mb: 0.75 }}>
            {effectiveOpen ? (
              <Box sx={{ px: 1.5, pt: 0.5, pb: 0.75 }}>
                <Typography
                  variant="overline"
                  sx={{ fontWeight: 950, color: palette.heading, letterSpacing: 1.25 }}
                >
                  {section.heading}
                </Typography>
              </Box>
            ) : null}

            {section.items.map((item) => {
              const key = `${item.to}::${item.code ?? item.label}`;
              const hasChildren = Boolean(item.children?.length);
              const isOpen = expanded[key] ?? false;
              const selected = isSelected(item);

              return (
                <React.Fragment key={key}>
                  <ListItem disablePadding sx={{ display: "block" }}>
                    <ListItemButton
                      component={RouterLink}
                      to={item.to}
                      selected={selected}
                      onClick={() => {
                        if (hasChildren && effectiveOpen) {
                          setExpanded((m) => ({ ...m, [key]: !isOpen }));
                        } else if (!isMdUp) {
                          setMobileOpen(false);
                        }
                      }}
                      sx={[
                        {
                          minHeight: 44,
                          px: 2,
                          borderRadius: 3,
                          mx: 0.5,
                          my: 0.25,
                          position: "relative",
                          "&.Mui-selected": {
                            bgcolor: palette.selectedBg,
                            color: "#0f172a",
                          },
                          "&.Mui-selected:hover": {
                            bgcolor: palette.selectedHoverBg,
                          },
                          ...(effectiveOpen
                            ? {
                                "&.Mui-selected::before": {
                                  content: '""',
                                  position: "absolute",
                                  left: 6,
                                  top: 10,
                                  bottom: 10,
                                  width: 3,
                                  borderRadius: 999,
                                  bgcolor: palette.accent,
                                },
                              }
                            : {}),
                          "&:hover": {
                            bgcolor: palette.hoverBg,
                          },
                        },
                        effectiveOpen ? { justifyContent: "initial" } : { justifyContent: "center", px: 1.25 },
                      ]}
                    >
                      <ListItemIcon
                        sx={[
                          { minWidth: 0, justifyContent: "center" },
                          effectiveOpen ? { mr: 2 } : { mr: 0 },
                          selected ? { color: palette.accent } : { color: palette.icon },
                        ]}
                      >
                        {item.icon ?? fallbackIcon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          noWrap: false,
                          fontSize: 14,
                          fontWeight: 650,
                          lineHeight: 1.2,
                          sx: twoLineClamp,
                        }}
                        sx={[effectiveOpen ? { opacity: 1 } : { display: "none" }]}
                      />
                      {hasChildren && effectiveOpen ? (isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />) : null}
                    </ListItemButton>
                  </ListItem>

                  {hasChildren ? (
                    <Collapse in={effectiveOpen && isOpen} timeout="auto" unmountOnExit>
                      <List disablePadding sx={{ pl: 1.5 }}>
                        {(item.children ?? []).map((c) => {
                          const childKey = `${c.to}::${c.label}`;
                          return (
                          <ListItem key={childKey} disablePadding sx={{ display: "block" }}>
                            <ListItemButton
                              component={RouterLink}
                              to={c.to}
                              selected={activePath === c.to}
                              onClick={() => {
                                if (!isMdUp) setMobileOpen(false);
                              }}
                              sx={{
                                minHeight: 40,
                                px: 2,
                                borderRadius: 3,
                                mx: 0.5,
                                my: 0.25,
                                position: "relative",
                                "&.Mui-selected": {
                                  bgcolor: palette.childSelectedBg,
                                },
                                "&.Mui-selected::before": {
                                  content: '""',
                                  position: "absolute",
                                  left: 6,
                                  top: 10,
                                  bottom: 10,
                                  width: 3,
                                  borderRadius: 999,
                                  bgcolor: palette.childAccent,
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", mr: 2 }}>
                                {c.icon ?? fallbackIcon}
                              </ListItemIcon>
                              <ListItemText
                                primary={c.label}
                                primaryTypographyProps={{
                                  noWrap: false,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  lineHeight: 1.2,
                                  sx: twoLineClamp,
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                        })}
                      </List>
                    </Collapse>
                  ) : null}
                </React.Fragment>
              );
            })}
          </Box>
        ))}
      </List>

      <Box sx={{ flex: 1 }} />

      <Divider />

      
    </Box>
  );

  return (
    <Box sx={{ display: "flex",bgcolor: "#f6f6f8", overflowX: "hidden", maxWidth: "100%" }}>
      <CssBaseline />
      <AppBar position="fixed" open={isMdUp ? open : false} color="inherit" elevation={0}>
        <Toolbar sx={{ borderBottom: "1px solid rgba(2, 6, 23, 0.08)" }}>
          {isMdUp ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={[
                { mr: 2 },
                isMdUp && open && { display: "none" },
              ]}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              mr: 2,
              gap: 0.25,
              overflow: "hidden",
            }}
          >
            {/* <SisLogo height={72} /> */}
            <Typography
              variant="body2"
              fontWeight={900}
              noWrap
              sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {userName ?? "User"}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={900}
              noWrap
              sx={{ color: "rgba(0,0,0,0.7)", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {role ?? "User"}
            </Typography>
          </Box>
          {topBarCenter ? (
            <Box sx={{ display: { xs: "none", md: "block" }, flex: 1, minWidth: 0 }}>
              {topBarCenter}
            </Box>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {rightSlot}
            {!isMdUp && !disableMobileDrawer ? (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="end"
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            ) : null}
          </Box>
        </Toolbar>
      </AppBar>

      {isMdUp ? (
        <Drawer variant="permanent" open={open}>
          {drawerContent}
        </Drawer>
      ) : !disableMobileDrawer ? (
        <MuiDrawer
          open={mobileOpen}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: drawerWidth } }}
        >
          {drawerContent}
        </MuiDrawer>
      ) : null}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          maxWidth: "100%",
          overflowX: "hidden",
          p: { xs: 2, md: 3 },
          pb: bottomNav && !isMdUp ? "88px" : undefined,
        }}
      >
        <DrawerHeader />
        {children}
      </Box>

      {bottomNav && !isMdUp ? (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (t) => t.zIndex.appBar + 1,
          }}
        >
          {bottomNav}
        </Box>
      ) : null}
    </Box>
  );
}
