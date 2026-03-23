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
};

type AdAppShellProps = {
  title?: string;
  subtitle?: string;
  brand?: string;
  navItems: NavItem[];
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  /** Optional current path for selected styling; defaults to router location. */
  currentPath?: string;
  /** Optional user info displayed in the drawer footer. */
  userName?: string;
  userEmail?: string;
  /** Optional footer action; defaults to no-op. */
  onSettingsClick?: () => void;
};

const drawerWidth = 240;

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

export default function AdAppShell({
  title = "SIS EHRM",
  // subtitle = "Enterprise Human Resource Management",
  brand,
  navItems,
  rightSlot,
  children,
  currentPath,
  userName,
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

  const effectiveOpen = isMdUp ? open : mobileOpen;
  const fallbackIcon = <DashboardIcon fontSize="small" />;

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
        bgcolor: "#ffffff",
        background:
          "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
        borderRight: "1px solid rgba(2, 6, 23, 0.08)",
      }}
    >
      <DrawerHeader sx={{ justifyContent: effectiveOpen ? "space-between" : "center", px: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SisLogo height={32} />
          </Box>
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
          sx={{ display: effectiveOpen ? "block" : "none", fontWeight: 700 }}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: effectiveOpen ? "block" : "none" }}
        >
          {/* {subtitle} */}
        </Typography>
      </Box>

      <Box sx={{ px: effectiveOpen ? 2 : 1, pb: 1, display: effectiveOpen ? "block" : "none" }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 900, color: "rgba(2,6,23,0.55)", letterSpacing: 1.2 }}
        >
          Main Menu
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const key = item.to;
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
                        bgcolor: "rgba(216,27,96,0.10)",
                        color: "#0f172a",
                      },
                      "&.Mui-selected:hover": {
                        bgcolor: "rgba(216,27,96,0.12)",
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
                              bgcolor: "#d81b60",
                            },
                          }
                        : {}),
                      "&:hover": {
                        bgcolor: "rgba(2,6,23,0.05)",
                      },
                    },
                    effectiveOpen ? { justifyContent: "initial" } : { justifyContent: "center", px: 1.25 },
                  ]}
                >
                  <ListItemIcon
                    sx={[
                      { minWidth: 0, justifyContent: "center" },
                      effectiveOpen ? { mr: 2 } : { mr: 0 },
                      selected ? { color: "#d81b60" } : { color: "rgba(2,6,23,0.72)" },
                    ]}
                  >
                    {item.icon ?? fallbackIcon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ noWrap: true, fontSize: 14, fontWeight: 650 }}
                    sx={[effectiveOpen ? { opacity: 1 } : { display: "none" }]}
                  />
                  {hasChildren && effectiveOpen ? (isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />) : null}
                </ListItemButton>
              </ListItem>

              {hasChildren ? (
                <Collapse in={effectiveOpen && isOpen} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 1.5 }}>
                    {(item.children ?? []).map((c) => (
                      <ListItem key={c.to} disablePadding sx={{ display: "block" }}>
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
                              bgcolor: "rgba(59,130,246,0.10)",
                            },
                            "&.Mui-selected::before": {
                              content: '""',
                              position: "absolute",
                              left: 6,
                              top: 10,
                              bottom: 10,
                              width: 3,
                              borderRadius: 999,
                              bgcolor: "#3b82f6",
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", mr: 2 }}>
                            {c.icon ?? fallbackIcon}
                          </ListItemIcon>
                          <ListItemText
                            primary={c.label}
                            primaryTypographyProps={{ noWrap: true, fontSize: 13, fontWeight: 600 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              ) : null}
            </React.Fragment>
          );
        })}
      </List>

      <Box sx={{ flex: 1 }} />

      <Divider />

      <Box sx={{ p: 1.5 }}>
        {effectiveOpen ? (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              p: 1.25,
              borderRadius: 3,
              border: "1px solid rgba(2,6,23,0.08)",
              bgcolor: "rgba(2,6,23,0.02)",
              overflow: "hidden",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(216,27,96,0.14)", color: "#d81b60", fontWeight: 900 }}>
              {(userName ?? "U").slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <Typography
                variant="body2"
                fontWeight={900}
                noWrap
                sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {userName ?? "User"}
              </Typography>
              {userEmail ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
                >
                  {userEmail}
                </Typography>
              ) : null}
            </Box>
            <IconButton aria-label="settings" onClick={settingsHandler} size="small">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack
            spacing={1}
            alignItems="center"
            sx={{
              p: 1,
              borderRadius: 3,
              border: "1px solid rgba(2,6,23,0.08)",
              bgcolor: "rgba(2,6,23,0.02)",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(216,27,96,0.14)", color: "#d81b60", fontWeight: 900 }}>
              {(userName ?? "U").slice(0, 2).toUpperCase()}
            </Avatar>
            <IconButton aria-label="settings" onClick={settingsHandler} size="small">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}

        {isMdUp && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <Chip
              size="small"
              label={effectiveOpen ? "Collapse" : "Expand"}
              onClick={() => setOpen((v) => !v)}
              variant="outlined"
            />
          </Stack>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f6f8" }}>
      <CssBaseline />
      <AppBar position="fixed" open={isMdUp ? open : false} color="inherit" elevation={0}>
        <Toolbar sx={{ borderBottom: "1px solid rgba(2, 6, 23, 0.08)" }}>
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
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 900 }}>
            {title}
          </Typography>
          {rightSlot}
        </Toolbar>
      </AppBar>

      {isMdUp ? (
        <Drawer variant="permanent" open={open}>
          {drawerContent}
        </Drawer>
      ) : (
        <MuiDrawer
          open={mobileOpen}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: drawerWidth } }}
        >
          {drawerContent}
        </MuiDrawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
