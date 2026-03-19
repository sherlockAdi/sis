import { useState } from "react";
import {
  Box,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import {
  AdTextBox, AdButton, AdTextArea, AdRemarkBox, AdAlertBox, AdChips, AdLabel,
  AdDropDown,
  AdCheckBox,
  AdDropDownMulti,
  AdDateTimePicker,
  AdSearchBox,
  AdFilter,
  AdSlider,
  adCookieStorage,
  AdNotification,
  AdModal,
  AdCard,
  AdCardGrid,
  AdGrid,
  AdPagingGrid,
  AdEditGrid
} from "../../common/ad";
import Ad3DBackground from "../../common/ad/Ad3DBackground";


const codeBlock = `import { AdTextBox } from \"@/common/ad\";

<AdTextBox
  label=\"Username\"
  placeholder=\"Enter username\"
  required
  clearable
  prefixIcon={<PersonIcon />}
/>`;

export default function GuidePage() {
  const pagingRows = Array.from({ length: 28 }, (_, i) => ({
    id: i + 1,
    token: 100 + (i + 1),
    patient: `Patient ${i + 1}`,
    department: i % 3 === 0 ? "IPD" : "OPD",
    status: i % 4 === 0 ? "Seen" : "Waiting",
  }));

  const editGridRows = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    qty: (i + 1) * 2,
    price: 50 + i * 10,
  }));

  const [sliderValue, setSliderValue] = useState(30);
  const [cookieValue, setCookieValue] = useState<any>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box
      position="relative"
      minHeight="100vh"
      width="100vw"
      overflow="hidden"
      sx={{ p: 0, m: 0 }}
    >
      <Ad3DBackground />

      <Box position="relative" zIndex={1} sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Stack spacing={1} mb={3} sx={{ px: { xs: 0, md: 0 } }}>
          <Typography variant="h4" fontWeight={800}>
            AD Component Guide
          </Typography>
        </Stack>

        <AdCardGrid itemSize={{ xs: 12, md: 12 }} spacing={2.5}>
          <AdCard
            title="AdCard + AdCardGrid"
            subtitle="Use these to keep all guide sections aligned and consistent."
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 12 }}>
                <AdCardGrid itemSize={{ xs: 12, md: 4 }} spacing={2}>
                  <AdCard
                    animate={false}
                    title="Card Title"
                    subtitle="Optional subtitle"
                    headerRight={<AdButton variant="text">Action</AdButton>}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Put any content here (forms, grids, text, etc).
                    </Typography>
                  </AdCard>

                  <AdCard animate={false} title="Second Card">
                    <Typography variant="body2" color="text.secondary">
                      Use `AdCardGrid` to place cards in columns.
                    </Typography>
                  </AdCard>

                  <AdCard animate={false} title="Third Card">
                    <Typography variant="body2" color="text.secondary">
                      Works responsively with MUI Grid `size`.
                    </Typography>
                  </AdCard>
                </AdCardGrid>
              </Grid>

              <Grid size={{ xs: 12, md: 12 }}>
                <Typography variant="subtitle2" mb={1}>
                  Usage
                </Typography>

                <Box
                  component="pre"
                  sx={{
                    bgcolor: "#0f172a",
                    color: "#e2e8f0",
                    p: 2,
                    borderRadius: 2,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  }}
                >
                  {`import { AdCard, AdCardGrid, AdButton } from "@/common/ad";

<AdCardGrid itemSize={{ xs: 12, md: 4 }} spacing={2}>
  <AdCard title="Card Title" subtitle="Optional subtitle" headerRight={<AdButton variant="text">Action</AdButton>}>
    Content...
  </AdCard>
  <AdCard title="Second Card">Content...</AdCard>
  <AdCard title="Third Card">Content...</AdCard>
</AdCardGrid>`}
                </Box>
              </Grid>
            </Grid>
          </AdCard>

          <AdCard title="AdSearchBox + AdFilter" subtitle="AdFilter opens from the right like a sidebar.">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AdSearchBox
                    placeholder="Search patient / token…"
                    debounceMs={300}
                    onSearch={(q) => console.log("Search:", q)}
                  />
                  <AdFilter
                    title="Patient Filters"
                    footer={
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <AdButton variant="text" onClick={() => console.log("Reset filters")}>
                          Reset
                        </AdButton>
                        <AdButton onClick={() => console.log("Apply filters")}>Apply</AdButton>
                      </Stack>
                    }
                  >
                    <Stack spacing={2}>
                      <AdDropDown
                        label="Department"
                        options={[
                          { label: "OPD", value: "opd" },
                          { label: "IPD", value: "ipd" },
                        ]}
                      />
                      <AdDateTimePicker label="From Date" />
                      <AdDateTimePicker label="To Date" />
                      <AdCheckBox label="Only waiting" />
                    </Stack>
                  </AdFilter>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 12 }}>
                <Typography variant="subtitle2" mb={1}>
                  Usage
                </Typography>

                <Box
                  component="pre"
                  sx={{
                    bgcolor: "#0f172a",
                    color: "#e2e8f0",
                    p: 2,
                    borderRadius: 2,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  }}
                >
                  {`import { AdSearchBox, AdFilter, AdButton } from "@/common/ad";

<AdSearchBox debounceMs={300} onSearch={(q) => console.log(q)} />

<AdFilter title="Filters">
  {/* filter fields */}
</AdFilter>`}
                </Box>
              </Grid>
            </Grid>
          </AdCard>

          <AdCard title="AdSlider + adCookieStorage + AdNotification + AdModal">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  <AdSlider
                    label="Opacity"
                    min={0}
                    max={100}
                    step={1}
                    value={sliderValue}
                    onChange={(v) => setSliderValue(v)}
                  />

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <AdButton
                      onClick={() => {
                        adCookieStorage.set("ad_slider", sliderValue, { days: 7 });
                        setNotification({ open: true, message: "Saved to cookie: ad_slider", severity: "success" });
                      }}
                    >
                      Save Cookie
                    </AdButton>
                    <AdButton
                      variant="secondary"
                      onClick={() => {
                        const val = adCookieStorage.get("ad_slider");
                        setCookieValue(val);
                        setNotification({ open: true, message: "Read cookie: ad_slider", severity: "info" });
                      }}
                    >
                      Read Cookie
                    </AdButton>
                    <AdButton
                      variant="text"
                      onClick={() => {
                        adCookieStorage.remove("ad_slider");
                        setCookieValue(null);
                        setNotification({ open: true, message: "Removed cookie: ad_slider", severity: "warning" });
                      }}
                    >
                      Remove Cookie
                    </AdButton>
                    <AdButton variant="secondary" onClick={() => setModalOpen(true)}>
                      Open Modal
                    </AdButton>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Cookie value: <strong>{cookieValue === null ? "null" : String(cookieValue)}</strong>
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 12 }}>
                <Typography variant="subtitle2" mb={1}>
                  Usage
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: "#0f172a",
                    color: "#e2e8f0",
                    p: 2,
                    borderRadius: 2,
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  }}
                >
                  {`import { AdSlider, adCookieStorage, AdNotification, AdModal, AdButton } from "@/common/ad";

const [val, setVal] = useState(30);
const [toastOpen, setToastOpen] = useState(false);
const [modalOpen, setModalOpen] = useState(false);

<AdSlider value={val} onChange={setVal} />
<AdButton onClick={() => adCookieStorage.set("ad_slider", val)}>Save</AdButton>

<AdNotification open={toastOpen} message="Saved" onClose={() => setToastOpen(false)} />

<AdModal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal">
  Modal content...
</AdModal>`}
                </Box>
              </Grid>
            </Grid>
          </AdCard>

          <AdCard title="AdDateTimePicker">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2} sx={{ maxWidth: 260 }}>
                    <AdDateTimePicker label="Appointment Date & Time" />

                    <AdDateTimePicker
                      label="Required Field"
                      required
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdDateTimePicker } from "@/common/ad";

<AdDateTimePicker label="Appointment Date & Time" />

<AdDateTimePicker
  label="Schedule Time"
  required
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdEditGrid">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 12 }}>
                  <AdEditGrid
                    showToolbar
                    initialRows={editGridRows}
                    columns={[
                      { field: "name", headerName: "Name", flex: 1, minWidth: 160, editable: true },
                      { field: "qty", headerName: "Qty", width: 110, type: "number", editable: true },
                      { field: "price", headerName: "Price", width: 120, type: "number", editable: true },
                    ]}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdEditGrid } from "@/common/ad";

<AdEditGrid
  initialRows={[{ id: 1, name: "Item 1", qty: 2, price: 50 }]}
  columns={[
    { field: "name", headerName: "Name", flex: 1, minWidth: 160, editable: true },
    { field: "qty", headerName: "Qty", width: 110, type: "number", editable: true },
    { field: "price", headerName: "Price", width: 120, type: "number", editable: true },
  ]}
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdPagingGrid">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 12 }}>
                  <AdPagingGrid
                    height={520}
                    showToolbar
                    showExport
                    exportFileName="Chikitshak-Guide-PagingGrid"
                    pdfTitle="Chikitshak - Paging Grid"
                    rows={pagingRows}
                    columns={[
                      { field: "token", headerName: "Token", width: 110, type: "number", sortable: true },
                      { field: "patient", headerName: "Patient", minWidth: 160, flex: 1, sortable: true },
                      { field: "department", headerName: "Department", width: 140, sortable: true },
                      {
                        field: "status",
                        headerName: "Status",
                        width: 140,
                        sortable: true,
                        renderCell: (params: any) => (
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={params.value === "Waiting" ? "warning.main" : "success.main"}
                          >
                            {params.value}
                          </Typography>
                        ),
                      },
                    ]}
                    checkboxSelection
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdPagingGrid } from "@/common/ad";

<AdPagingGrid
  height={420}
  defaultPageSize={10}
  showToolbar
  showExport
  exportFileName="Chikitshak-Report"
  pdfTitle="Chikitshak - Report"
  rows={[{ id: 1, token: 101, patient: "Patient 1" }]}
  columns={[
    { field: "token", headerName: "Token", width: 110, type: "number" },
    { field: "patient", headerName: "Patient", flex: 1, minWidth: 160 },
  ]}
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdGrid">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 12 }}>
                  <AdGrid
                    showToolbar
                    showExport
                    exportFileName="Chikitshak-Guide-Grid"
                    pdfTitle="Chikitshak - Sample Grid"
                    rows={[
                      { id: 1, token: 12, patient: "Asha", department: "OPD", status: "Waiting" },
                      { id: 2, token: 13, patient: "Rohit", department: "OPD", status: "Waiting" },
                      { id: 3, token: 14, patient: "Meera", department: "IPD", status: "Seen" },
                      { id: 4, token: 15, patient: "Kabir", department: "OPD", status: "Seen" },
                    ]}
                    columns={[
                      { field: "token", headerName: "Token", width: 110, type: "number", sortable: true },
                      { field: "patient", headerName: "Patient", minWidth: 160, flex: 1, sortable: true },
                      { field: "department", headerName: "Department", width: 140, sortable: true },
                      {
                        field: "status",
                        headerName: "Status",
                        width: 140,
                        sortable: true,
                        renderCell: (params: any) => (
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={params.value === "Waiting" ? "warning.main" : "success.main"}
                          >
                            {params.value}
                          </Typography>
                        ),
                      },
                    ]}
                    checkboxSelection
                    initialState={{
                      sorting: { sortModel: [{ field: "token", sort: "asc" }] },
                    }}
                    onRowClick={(params: any) => console.log("Row:", params.row)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdGrid } from "@/common/ad";

<AdGrid
  showToolbar
  showExport
  exportFileName="Chikitshak-Report"
  pdfTitle="Chikitshak - OPD Report"
  rows={[{ id: 1, token: 12, patient: "Asha" }]}
  columns={[
    { field: "token", headerName: "Token", width: 110, type: "number" },
    { field: "patient", headerName: "Patient", flex: 1, minWidth: 160 },
  ]}
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdDropDownMulti">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2} sx={{ maxWidth: 260 }}>
                    <AdDropDownMulti
                      label="Select Skills"
                      options={[
                        { label: "React", value: "react" },
                        { label: "NodeJS", value: "node" },
                        { label: "TypeScript", value: "ts" },
                        { label: "MongoDB", value: "mongo" },
                      ]}
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdDropDownMulti } from "@/common/ad";

<AdDropDownMulti
  label="Select Skills"
  options={[
    { label: "React", value: "react" },
    { label: "NodeJS", value: "node" },
    { label: "TypeScript", value: "ts" },
    { label: "MongoDB", value: "mongo" }
  ]}
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdCheckBox">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1}>
                    <AdCheckBox label="Accept Terms" />
                    <AdCheckBox label="Subscribe Newsletter" />
                    <AdCheckBox label="Disabled Option" disabled />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdCheckBox } from "@/common/ad";

<AdCheckBox label="Accept Terms" />

<AdCheckBox
  label="Subscribe Newsletter"
  onChange={(v) => console.log(v)}
/>

<AdCheckBox
  label="Disabled Option"
  disabled
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdDropDown">
              <Grid container spacing={2}>
                {/* Demo Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2} sx={{ maxWidth: 260 }}>
                    <AdDropDown
                      label="Select Country"
                      options={[
                        { label: "India", value: "india" },
                        { label: "USA", value: "usa" },
                        { label: "Canada", value: "canada" },
                      ]}
                    />

                    <AdDropDown
                      label="Select Status"
                      options={[
                        { label: "Active", value: "active" },
                        { label: "Inactive", value: "inactive" },
                        { label: "Pending", value: "pending" },
                      ]}
                    />

                    <AdDropDown
                      label="Required Field"
                      required
                      options={[
                        { label: "Option 1", value: "1" },
                        { label: "Option 2", value: "2" },
                      ]}
                    />
                  </Stack>
                </Grid>

                {/* Code Section */}
                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdDropDown } from "@/common/ad";

<AdDropDown
  label="Select Country"
  options={[
    { label: "India", value: "india" },
    { label: "USA", value: "usa" },
    { label: "Canada", value: "canada" }
  ]}
/>

<AdDropDown
  label="Required Field"
  required
  options={[
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" }
  ]}
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdLabel">
              <Grid container spacing={2}>
                {/* Demo Side */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <AdLabel text="Username" />

                    <AdLabel text="Email Address" required />

                    <AdLabel text="Password" color="secondary" />

                    <Stack>
                      <AdLabel text="First Name" required />
                      <AdTextBox placeholder="Enter first name" />
                    </Stack>
                  </Stack>
                </Grid>

                {/* Code Side */}
                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdLabel } from "@/common/ad";

<AdLabel text="Username" />

<AdLabel
  text="Email Address"
  required
/>

<AdLabel
  text="Password"
  color="secondary"
/>

<AdLabel text="First Name" required />
<AdTextBox placeholder="Enter first name" />`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdChips">
              <Grid container spacing={2}>
                {/* Demo Chips */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <AdChips label="Default" />

                    <AdChips
                      label="Primary"
                      color="primary"
                    />

                    <AdChips
                      label="Outlined"
                      color="secondary"
                      variant="outlined"
                    />

                    <AdChips
                      label="Clickable"
                      color="success"
                      clickable
                      onClick={() => console.log("Clicked")}
                    />

                    <AdChips
                      label="Deletable"
                      color="error"
                      deletable
                      onDelete={() => console.log("Deleted")}
                    />
                  </Stack>
                </Grid>

                {/* Code Section */}
                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdChips } from "@/common/ad";

<AdChips label="Default" />

<AdChips
  label="Primary"
  color="primary"
/>

<AdChips
  label="Outlined"
  color="secondary"
  variant="outlined"
/>

<AdChips
  label="Clickable"
  color="success"
  clickable
/>

<AdChips
  label="Deletable"
  color="error"
  deletable
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard delayMs={80} timeoutMs={600}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CodeIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  AdAlertBox
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Reusable alert component with severity, optional title, helper text,
                close button, and auto-dismiss support.
              </Typography>

              <Grid container spacing={2}>
                {/* Demo Side */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <AdAlertBox
                      severity="success"
                      title="Success"
                      message="Your changes have been saved successfully!"
                      autoHideDuration={5000}
                    />

                    <AdAlertBox
                      severity="error"
                      message="Something went wrong. Please try again."
                    />

                    <AdAlertBox
                      severity="info"
                      title="Info"
                      message="This is an informational alert."
                      closable={false}
                    />

                    <AdAlertBox
                      severity="warning"
                      title="Warning"
                      message="Please check the fields before submitting."
                    />
                  </Stack>
                </Grid>

                {/* Code Side */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import AdAlertBox from "@/common/ad/AdAlertBox";

<AdAlertBox
  severity="success"
  title="Success"
  message="Your changes have been saved successfully!"
  autoHideDuration={5000}
/>

<AdAlertBox
  severity="error"
  message="Something went wrong. Please try again."
/>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard timeoutMs={450} delayMs={0}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CodeIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  AdRemarkBox
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Remark Box Content
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    {/* <AdTextArea label="Default" placeholder="Enter text" clearable /> */}
                    <AdRemarkBox
                      // label="Required + Email"
                      // type="text"
                      // required
                      placeholder="enter your remark here"
                    // helperText="Checks required + email format"
                    />

                  </Stack>
                </Grid>


              </Grid>
          </AdCard>

          <AdCard timeoutMs={450} delayMs={0}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CodeIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Ad Text Area
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Reusable textarea component with auto-resize, validation, helper text,
                and controlled/uncontrolled support.
              </Typography>

              <Grid container spacing={2}>
                {/* Demo Side */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <AdTextArea
                      label="Default"
                      placeholder="Enter text..."
                    />

                    <AdTextArea
                      label="Required"
                      required
                      placeholder="Enter your remarks..."
                      helperText="This field is required"
                    />

                    <AdTextArea
                      label="Min Length Validation"
                      minLength={10}
                      placeholder="Minimum 10 characters"
                    />

                    <AdTextArea
                      label="Max Length"
                      maxLength={200}
                      placeholder="Max 200 characters allowed"
                    />
                  </Stack>
                </Grid>

                {/* Code Side */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>

                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdTextArea } from "@/common/ad";

<AdTextArea
  label="Remarks"
  placeholder="Enter your remarks..."
  required
  minLength={10}
  maxLength={200}
/>`}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" mb={1}>
                    Props (key)
                  </Typography>

                  <Typography variant="body2" color="text.secondary" component="div">
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      <li>
                        <strong>value/onChange</strong> (controlled) or defaultValue (uncontrolled)
                      </li>
                      <li>
                        <strong>validation</strong>: required, minLength, maxLength
                      </li>
                      <li>
                        <strong>rows</strong>: minRows, maxRows
                      </li>
                      <li>
                        <strong>UI</strong>: prefixIcon, suffixIcon, helperText, error, fullWidth
                      </li>
                      <li>
                        <strong>events</strong>: onBlur, onFocus
                      </li>
                    </ul>
                  </Typography>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard timeoutMs={450} delayMs={0}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CodeIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Ad Text Box
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Reusable text input with validation, adornments, password toggle, clear button, and
                controlled/uncontrolled support.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <AdTextBox label="Default" placeholder="Enter text" clearable />
                    <AdTextBox
                      label="Required + Email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      helperText="Checks required + email format"
                    />
                    <AdTextBox
                      label="Password with toggle"
                      type="password"
                      required
                      minLength={6}
                      showPasswordToggle
                      helperText="Min length 6"
                    />
                    <AdTextBox
                      label="With max length"
                      placeholder="Max 12 chars"
                      maxLength={12}
                      clearable
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {codeBlock}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" mb={1}>
                    Props (key)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      <li>
                        <strong>value/onChange</strong> (controlled) or defaultValue (uncontrolled)
                      </li>
                      <li>
                        <strong>type</strong>: text | password | email | number
                      </li>
                      <li>
                        <strong>validation</strong>: required, minLength, maxLength, pattern, email,
                        number
                      </li>
                      <li>
                        <strong>UI</strong>: clearable, showPasswordToggle, prefixIcon, suffixIcon,
                        helperText, error, size, variant, fullWidth
                      </li>
                      <li>
                        <strong>events</strong>: onBlur, onFocus, onEnter
                      </li>
                    </ul>
                  </Typography>
                </Grid>
              </Grid>
          </AdCard>

          <AdCard title="AdButton">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <AdButton>Primary</AdButton>
                    <AdButton variant="secondary">Secondary</AdButton>
                    <AdButton variant="text">Text</AdButton>
                    <AdButton loading>Loading</AdButton>
                    <AdButton startIcon={<CodeIcon />}>Start Icon</AdButton>
                    <AdButton endIcon={<CodeIcon />}>End Icon</AdButton>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography variant="subtitle2" mb={1}>
                    Usage
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      p: 2,
                      borderRadius: 2,
                      fontSize: 13,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  >
                    {`import { AdButton } from "@/common/ad";

<AdButton>Primary</AdButton>
<AdButton variant="secondary">Secondary</AdButton>
<AdButton variant="text">Text</AdButton>
<AdButton loading>Saving…</AdButton>
<AdButton startIcon={<Icon/>}>Start</AdButton>
<AdButton endIcon={<Icon/>}>End</AdButton>`}
                  </Box>
                </Grid>
              </Grid>
          </AdCard>
        </AdCardGrid>
      </Box>

      <AdNotification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification((p) => ({ ...p, open: false }))}
      />

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="AdModal"
        subtitle="This is a reusable dialog wrapper."
        actions={
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" onClick={() => setModalOpen(false)}>
              Close
            </AdButton>
            <AdButton
              onClick={() => {
                setModalOpen(false);
                setNotification({ open: true, message: "Saved from modal", severity: "success" });
              }}
            >
              Save
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Current slider value: <strong>{sliderValue}</strong>
          </Typography>
          <AdSlider
            label="Change value"
            min={0}
            max={100}
            step={1}
            value={sliderValue}
            onChange={(v) => setSliderValue(v)}
          />
        </Stack>
      </AdModal>
    </Box>
  );
}
