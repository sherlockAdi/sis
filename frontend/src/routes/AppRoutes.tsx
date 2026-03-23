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
import CandidateApplicationsPage from "../modules/candidate/CandidateApplicationsPage";
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
import CompanyOverviewPage from "../modules/public/pages/about/CompanyOverviewPage";
import GlobalPresencePage from "../modules/public/pages/about/GlobalPresencePage";
import TrustCertificationsPage from "../modules/public/pages/about/TrustCertificationsPage";
import WhySisPage from "../modules/public/pages/about/WhySisPage";
import EmployerZoneLandingPage from "../modules/public/pages/employer/EmployerZoneLandingPage";
import EmployerWhyPartnerPage from "../modules/public/pages/employer/EmployerWhyPartnerPage";
import EmployerWorkforceSolutionsPage from "../modules/public/pages/employer/EmployerWorkforceSolutionsPage";
import EmployerProcessPage from "../modules/public/pages/employer/EmployerProcessPage";
import EmployerInquiryPage from "../modules/public/pages/employer/EmployerInquiryPage";
import PartnerZoneLandingPage from "../modules/public/pages/partner/PartnerZoneLandingPage";
import PartnerBenefitsPage from "../modules/public/pages/partner/PartnerBenefitsPage";
import PartnerHowItWorksPage from "../modules/public/pages/partner/PartnerHowItWorksPage";
import PartnerSubmitCandidatesPage from "../modules/public/pages/partner/PartnerSubmitCandidatesPage";

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

export default function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public marketing site (outer website) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicHomePage />} />
          {/* About (index + section pages) */}
          <Route path="/about" element={<AboutIndexPage />} />
          <Route path="/about/company-overview" element={<CompanyOverviewPage />} />
          <Route path="/about/global-presence" element={<GlobalPresencePage />} />
          <Route path="/about/trust-certifications" element={<TrustCertificationsPage />} />
          <Route path="/about/why-sis" element={<WhySisPage />} />

          {/* Legacy single-page about with anchors */}
          <Route path="/about-legacy" element={<PublicAboutPage />} />
          <Route path="/jobs" element={<PublicJobsPage />} />
          <Route path="/jobs/country/:countryCode" element={<PublicJobsByCountryPage />} />
          <Route path="/jobs/:jobId" element={<PublicJobDetailPage />} />
          {/* Employer Zone (landing + section pages) */}
          <Route path="/employer-zone" element={<EmployerZoneLandingPage />} />
          <Route path="/employer-zone/why-partner-with-sis" element={<EmployerWhyPartnerPage />} />
          <Route path="/employer-zone/workforce-solutions" element={<EmployerWorkforceSolutionsPage />} />
          <Route path="/employer-zone/process" element={<EmployerProcessPage />} />
          <Route path="/employer-zone/contact" element={<EmployerInquiryPage />} />

          {/* Legacy single-page employer zone */}
          <Route path="/employer-zone-legacy" element={<EmployerZonePage />} />
          {/* Partner Zone (landing + section pages) */}
          <Route path="/partner-zone" element={<PartnerZoneLandingPage />} />
          <Route path="/partner-zone/benefits" element={<PartnerBenefitsPage />} />
          <Route path="/partner-zone/how-it-works" element={<PartnerHowItWorksPage />} />
          <Route path="/partner-zone/submit-candidates" element={<PartnerSubmitCandidatesPage />} />

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
        <Route path="/companies" element={<Navigate to="/portal/companies" replace />} />
        <Route path="/opd" element={<Navigate to="/portal/opd" replace />} />
        <Route path="/ipd" element={<Navigate to="/portal/ipd" replace />} />

        {/* Keep previous landing available (internal demo page) */}
        <Route path="/legacy-landing" element={<LandingPage />} />

        <Route path="/portal" element={<RequireAuth />}>
          <Route element={<AppShellLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
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
            <Route path="candidate/jobs" element={<CandidateJobsPage />} />
            <Route path="candidate/applications" element={<CandidateApplicationsPage />} />
            <Route path="companies" element={<CompaniesPage />} />
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
