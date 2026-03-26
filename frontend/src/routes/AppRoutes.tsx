import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../modules/login/Login";
import AuthLogin from "../modules/login/AuthLogin";
import GuidePage from "../modules/guide/GuidePage";
import RequireAuth from "../common/auth/RequireAuth";
import Dashboard from "../modules/dashboard/Dashboard";
import AppShellLayout from "../layouts/AppShellLayout";
import LandingPage from "../modules/landing/LandingPage";
import CountriesPage from "../modules/location/CountriesPage";
import StatesPage from "../modules/location/StatesPage";
import CitiesPage from "../modules/location/CitiesPage";
import InterviewModesPage from "../modules/masters/InterviewModesPage";
import VisaTypesPage from "../modules/masters/VisaTypesPage";
import JobCategoriesPage from "../modules/masters/JobCategoriesPage";
import ContractDurationsPage from "../modules/masters/ContractDurationsPage";
import DocumentTypesPage from "../modules/masters/DocumentTypesPage";
import PaymentCategoriesPage from "../modules/masters/PaymentCategoriesPage";
import MenuManagementPage from "../modules/admin/MenuManagementPage";
import JobsPage from "../modules/job/JobsPage";
import JobsPreviewPage from "../modules/job/JobsPreviewPage";
import RecruitmentApplicationsPage from "../modules/recruitment/RecruitmentApplicationsPage";
import RecruitmentCandidatesPage from "../modules/recruitment/RecruitmentCandidatesPage";
import CandidateJobsPage from "../modules/candidate/CandidateJobsPage";
import CandidateJobApplyPage from "../modules/candidate/CandidateJobApplyPage";
import CandidateApplicationsPage from "../modules/candidate/CandidateApplicationsPage";
import CandidateApplicationDetailPage from "../modules/candidate/CandidateApplicationDetailPage";
import CandidateHomePage from "../modules/candidate/CandidateHomePage";
import CandidateTrainingPage from "../modules/candidate/CandidateTrainingPage";
import CandidateProfilePage from "../modules/candidate/CandidateProfilePage";
import CandidateProfileDocumentsPage from "../modules/candidate/CandidateProfileDocumentsPage";
import CandidateProfileTradeTestPage from "../modules/candidate/CandidateProfileTradeTestPage";
import CandidateProfileDeploymentPage from "../modules/candidate/CandidateProfileDeploymentPage";
import CandidateProfileHelpdeskPage from "../modules/candidate/CandidateProfileHelpdeskPage";
import CandidateProfileSettingsPage from "../modules/candidate/CandidateProfileSettingsPage";
import PartnerDashboardPage from "../modules/partner/PartnerDashboardPage";
import PartnerJobMandatesPage from "../modules/partner/PartnerJobMandatesPage";
import PartnerSubmitCandidatePage from "../modules/partner/PartnerSubmitCandidatePage";
import PartnerMySubmissionsPage from "../modules/partner/PartnerMySubmissionsPage";
import PartnerPerformancePage from "../modules/partner/PartnerPerformancePage";
import PartnerEarningsPage from "../modules/partner/PartnerEarningsPage";
import PartnerHelpdeskPage from "../modules/partner/PartnerHelpdeskPage";
import PartnerProfilePage from "../modules/partner/PartnerProfilePage";
import CompaniesPage from "../modules/company/CompaniesPage";
import PublicLayout from "../modules/public/layout/PublicLayout";
import PublicHomePage from "../modules/public/pages/PublicHomePage";
import PublicAboutPage from "../modules/public/pages/PublicAboutPage";
import PublicJobsPage from "../modules/public/pages/PublicJobsPage";
import PublicJobsByCountryPage from "../modules/public/pages/PublicJobsByCountryPage";
import PublicJobDetailPage from "../modules/public/pages/PublicJobDetailPage";
import EmployerZonePage from "../modules/public/pages/EmployerZonePage";
import PartnerZonePage from "../modules/public/pages/PartnerZonePage";
import PublicRegisterPage from "../modules/public/pages/PublicRegisterPage";
import PublicMenuPage from "../modules/public/pages/PublicMenuPage";
import AboutIndexPage from "../modules/public/pages/about/AboutIndexPage";
import EmployerZoneLandingPage from "../modules/public/pages/employer/EmployerZoneLandingPage";
import EmployerWhyPartnerPage from "../modules/public/pages/employer/EmployerWhyPartnerPage";
import EmployerWorkforceSolutionsPage from "../modules/public/pages/employer/EmployerWorkforceSolutionsPage";
import EmployerProcessPage from "../modules/public/pages/employer/EmployerProcessPage";
import EmployerInquiryPage from "../modules/public/pages/employer/EmployerInquiryPage";
import PartnerZoneLandingPage from "../modules/public/pages/partner/PartnerZoneLandingPage";
import PartnerBenefitsPage from "../modules/public/pages/partner/PartnerBenefitsPage";
import PartnerHowItWorksPage from "../modules/public/pages/partner/PartnerHowItWorksPage";
import PartnerSubmitCandidatesPage from "../modules/public/pages/partner/PartnerSubmitCandidatesPage";
import PlaceholderPage from "../modules/admin/PlaceholderPage";
import { useAuth } from "../common/auth/AuthContext";

const mode = import.meta.env.VITE_APP_MODE ?? "all";

// Optional, lazy-loaded modules so the build still works even if a module folder is absent
const opdModules = import.meta.glob("../modules/opd/OpdDashboard.tsx");
const ipdModules = import.meta.glob("../modules/ipd/IpdDashboard.tsx");

const OpdDashboard: any = opdModules["../modules/opd/OpdDashboard.tsx"]
  ? lazy(opdModules["../modules/opd/OpdDashboard.tsx"] as any)
  : null;

const IpdDashboard: any = ipdModules["../modules/ipd/IpdDashboard.tsx"]
  ? lazy(ipdModules["../modules/ipd/IpdDashboard.tsx"] as any)
  : null;

function PortalIndexRedirect() {
  const { me } = useAuth();
  const role = String(me?.role_code ?? "").toUpperCase();
  if (role === "CANDIDATE") return <Navigate to="candidate/home" replace />;
  if (role === "SOURCING" || role === "PARTNER") return <Navigate to="partner/dashboard" replace />;
  return <Navigate to="dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public marketing site (outer website) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicHomePage />} />
          {/* About (index + section pages) */}
          <Route path="/about" element={<AboutIndexPage />} />
          <Route path="/about/company-overview" element={<Navigate to="/about#overview" replace />} />
          <Route path="/about/global-presence" element={<Navigate to="/about#presence" replace />} />
          <Route path="/about/trust-certifications" element={<Navigate to="/about#trust" replace />} />
          <Route path="/about/why-sis" element={<Navigate to="/about#why" replace />} />

          {/* Legacy single-page about with anchors */}
          <Route path="/about-legacy" element={<PublicAboutPage />} />
          <Route path="/jobs" element={<PublicJobsPage />} />
          <Route path="/jobs/country/:countryCode" element={<PublicJobsByCountryPage />} />
          <Route path="/jobs/:jobId" element={<PublicJobDetailPage />} />
        {/* Employer Zone (landing + section pages) */}
          <Route path="/employer-zone" element={<EmployerZonePage />} />
          <Route path="/employer-zone/why-partner-with-sis" element={<Navigate to="/employer-zone#why" replace />} />
          <Route path="/employer-zone/workforce-solutions" element={<Navigate to="/employer-zone#solutions" replace />} />
          <Route path="/employer-zone/process" element={<Navigate to="/employer-zone#process" replace />} />
          <Route path="/employer-zone/contact" element={<Navigate to="/employer-zone#inquiry" replace />} />

          {/* Legacy single-page employer zone */}
          <Route path="/employer-zone-legacy" element={<EmployerZonePage />} />
          {/* Partner Zone (landing + section pages) */}
          <Route path="/partner-zone" element={<PartnerZonePage />} />
          <Route path="/partner-zone/benefits" element={<Navigate to="/partner-zone#benefits" replace />} />
          <Route path="/partner-zone/how-it-works" element={<Navigate to="/partner-zone#how" replace />} />
          <Route path="/partner-zone/submit-candidates" element={<Navigate to="/partner-zone#submit" replace />} />

          {/* Legacy single-page partner zone */}
          <Route path="/partner-zone-legacy" element={<PartnerZonePage />} />
          <Route path="/register" element={<PublicRegisterPage />} />
          <Route path="/menu" element={<PublicMenuPage />} />
        </Route>

        {/* Portal entry (apps) */}
        <Route path="/portal/login" element={<Login />} />
        <Route path="/portal/login/auth" element={<AuthLogin />} />

        {/* Legacy redirects */}
        <Route path="/login" element={<Navigate to="/portal/login" replace />} />
        <Route path="/login/auth" element={<Navigate to="/portal/login/auth" replace />} />
        <Route path="/dashboard" element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="/guide" element={<Navigate to="/portal/guide" replace />} />
        <Route path="/location/countries" element={<Navigate to="/portal/location/countries" replace />} />
        <Route path="/location/states" element={<Navigate to="/portal/location/states" replace />} />
        <Route path="/location/cities" element={<Navigate to="/portal/location/cities" replace />} />
        <Route
          path="/masters/recruitment/interview-modes"
          element={<Navigate to="/portal/masters/recruitment/interview-modes" replace />}
        />
        <Route
          path="/masters/recruitment/visa-types"
          element={<Navigate to="/portal/masters/recruitment/visa-types" replace />}
        />
        <Route
          path="/masters/job/categories"
          element={<Navigate to="/portal/masters/job/categories" replace />}
        />
        <Route
          path="/masters/job/contract-durations"
          element={<Navigate to="/portal/masters/job/contract-durations" replace />}
        />
        <Route
          path="/masters/documents/types"
          element={<Navigate to="/portal/masters/documents/types" replace />}
        />
        <Route
          path="/masters/payments/categories"
          element={<Navigate to="/portal/masters/payments/categories" replace />}
        />
        <Route
          path="/admin/menu-management"
          element={<Navigate to="/portal/admin/menu-management" replace />}
        />
        <Route path="/jobs-preview" element={<Navigate to="/portal/jobs-preview" replace />} />
        <Route
          path="/recruitment/applications"
          element={<Navigate to="/portal/recruitment/applications" replace />}
        />
        <Route
          path="/recruitment/candidates"
          element={<Navigate to="/portal/recruitment/candidates" replace />}
        />
        <Route path="/candidate/jobs" element={<Navigate to="/portal/candidate/jobs" replace />} />
        <Route
          path="/candidate/applications"
          element={<Navigate to="/portal/candidate/applications" replace />}
        />
        <Route path="/candidate/home" element={<Navigate to="/portal/candidate/home" replace />} />
        <Route path="/candidate/training" element={<Navigate to="/portal/candidate/training" replace />} />
        <Route path="/candidate/profile" element={<Navigate to="/portal/candidate/profile" replace />} />
        <Route path="/partner/dashboard" element={<Navigate to="/portal/partner/dashboard" replace />} />
        <Route path="/partner/job-mandates" element={<Navigate to="/portal/partner/job-mandates" replace />} />
        <Route path="/partner/submit-candidate" element={<Navigate to="/portal/partner/submit-candidate" replace />} />
        <Route path="/partner/my-submissions" element={<Navigate to="/portal/partner/my-submissions" replace />} />
        <Route path="/partner/performance" element={<Navigate to="/portal/partner/performance" replace />} />
        <Route path="/partner/earnings" element={<Navigate to="/portal/partner/earnings" replace />} />
        <Route path="/partner/helpdesk" element={<Navigate to="/portal/partner/helpdesk" replace />} />
        <Route path="/partner/profile" element={<Navigate to="/portal/partner/profile" replace />} />
        <Route path="/companies" element={<Navigate to="/portal/companies" replace />} />
        <Route path="/opd" element={<Navigate to="/portal/opd" replace />} />
        <Route path="/ipd" element={<Navigate to="/portal/ipd" replace />} />

        {/* Keep previous landing available (internal demo page) */}
        <Route path="/legacy-landing" element={<LandingPage />} />

        <Route path="/portal" element={<RequireAuth />}>
          <Route element={<AppShellLayout />}>
            <Route index element={<PortalIndexRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="location/countries" element={<CountriesPage />} />
            <Route path="location/states" element={<StatesPage />} />
            <Route path="location/cities" element={<CitiesPage />} />
            <Route path="masters/recruitment/interview-modes" element={<InterviewModesPage />} />
            <Route path="masters/recruitment/visa-types" element={<VisaTypesPage />} />
            <Route path="masters/job/categories" element={<JobCategoriesPage />} />
            <Route path="masters/job/contract-durations" element={<ContractDurationsPage />} />
            <Route path="masters/documents/types" element={<DocumentTypesPage />} />
            <Route path="masters/payments/categories" element={<PaymentCategoriesPage />} />
            <Route path="admin/menu-management" element={<MenuManagementPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs-preview" element={<JobsPreviewPage />} />
            <Route path="recruitment/applications" element={<RecruitmentApplicationsPage />} />
            <Route path="recruitment/candidates" element={<RecruitmentCandidatesPage />} />
            <Route path="candidate/home" element={<CandidateHomePage />} />
            <Route path="candidate/jobs" element={<CandidateJobsPage />} />
            <Route path="candidate/jobs/:jobId/apply" element={<CandidateJobApplyPage />} />
            <Route path="candidate/applications" element={<CandidateApplicationsPage />} />
            <Route path="candidate/applications/:applicationId" element={<CandidateApplicationDetailPage />} />
            <Route path="candidate/training" element={<CandidateTrainingPage />} />
            <Route path="candidate/profile" element={<CandidateProfilePage />} />
            <Route path="candidate/profile/documents" element={<CandidateProfileDocumentsPage />} />
            <Route path="candidate/profile/trade-test" element={<CandidateProfileTradeTestPage />} />
            <Route path="candidate/profile/deployment" element={<CandidateProfileDeploymentPage />} />
            <Route path="candidate/profile/helpdesk" element={<CandidateProfileHelpdeskPage />} />
            <Route path="candidate/profile/settings" element={<CandidateProfileSettingsPage />} />
            <Route path="partner/dashboard" element={<PartnerDashboardPage />} />
            <Route path="partner/job-mandates" element={<PartnerJobMandatesPage />} />
            <Route path="partner/submit-candidate" element={<PartnerSubmitCandidatePage />} />
            <Route path="partner/my-submissions" element={<PartnerMySubmissionsPage />} />
            <Route path="partner/performance" element={<PartnerPerformancePage />} />
            <Route path="partner/earnings" element={<PartnerEarningsPage />} />
            <Route path="partner/helpdesk" element={<PartnerHelpdeskPage />} />
            <Route path="partner/profile" element={<PartnerProfilePage />} />
            <Route path="companies" element={<CompaniesPage />} />

            {/* Admin scaffolding routes (dummy pages for now, safe for dynamic Menu Management paths) */}
            <Route
              path="recruitment/job-management"
              element={<PlaceholderPage title="Recruitment • Job Management" nextLinks={[{ label: "Jobs", to: "/portal/jobs" }]} />}
            />
            <Route
              path="recruitment/candidate-management"
              element={<PlaceholderPage title="Recruitment • Candidate Management" nextLinks={[{ label: "Candidates", to: "/portal/recruitment/candidates" }]} />}
            />
            <Route
              path="recruitment/screening-interviews"
              element={<PlaceholderPage title="Recruitment • Screening & Interviews" />}
            />
            <Route path="trade-test" element={<PlaceholderPage title="Trade Test & Assessment" />} />
            <Route path="trade-test/*" element={<PlaceholderPage title="Trade Test & Assessment" />} />

            <Route path="training" element={<PlaceholderPage title="Training & LMS" />} />
            <Route path="training/*" element={<PlaceholderPage title="Training & LMS" />} />

            <Route path="deployment" element={<PlaceholderPage title="Deployment Management" />} />
            <Route path="deployment/*" element={<PlaceholderPage title="Deployment Management" />} />

            <Route path="attendance" element={<PlaceholderPage title="Attendance & Workforce" />} />
            <Route path="attendance/*" element={<PlaceholderPage title="Attendance & Workforce" />} />

            <Route path="helpdesk" element={<PlaceholderPage title="Ticketing & Helpdesk" />} />
            <Route path="helpdesk/*" element={<PlaceholderPage title="Ticketing & Helpdesk" />} />

            <Route path="customers" element={<PlaceholderPage title="Customer Management" />} />
            <Route path="customers/*" element={<PlaceholderPage title="Customer Management" />} />

            <Route path="partners" element={<PlaceholderPage title="Partner Management" />} />
            <Route path="partners/*" element={<PlaceholderPage title="Partner Management" />} />

            <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
            <Route path="reports/*" element={<PlaceholderPage title="Reports & Analytics" />} />

            <Route path="compliance" element={<PlaceholderPage title="Compliance & Documents" />} />
            <Route path="compliance/*" element={<PlaceholderPage title="Compliance & Documents" />} />

            <Route
              path="settings"
              element={
                <PlaceholderPage title="System Settings" nextLinks={[{ label: "Menu Management", to: "/portal/admin/menu-management" }]} />
              }
            />
            <Route
              path="settings/*"
              element={
                <PlaceholderPage title="System Settings" nextLinks={[{ label: "Menu Management", to: "/portal/admin/menu-management" }]} />
              }
            />

            {/* Catch-all inside portal */}
            <Route path="*" element={<PlaceholderPage title="Page not found (Dummy)" />} />
            {(mode === "opd" || mode === "all") && OpdDashboard && (
              <Route path="opd" element={<OpdDashboard />} />
            )}

            {(mode === "ipd" || mode === "all") && IpdDashboard && (
              <Route path="ipd" element={<IpdDashboard />} />
            )}
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
