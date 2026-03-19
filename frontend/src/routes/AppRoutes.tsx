import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "../modules/login/Login";
import GuidePage from "../modules/guide/GuidePage";
import RequireAuth from "../common/auth/RequireAuth";
import Dashboard from "../modules/dashboard/Dashboard";
import AppShellLayout from "../layouts/AppShellLayout";
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
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShellLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/location/countries" element={<CountriesPage />} />
            <Route path="/location/states" element={<StatesPage />} />
            <Route path="/location/cities" element={<CitiesPage />} />
            <Route
              path="/masters/recruitment/interview-modes"
              element={<InterviewModesPage />}
            />
            <Route path="/masters/recruitment/visa-types" element={<VisaTypesPage />} />
            <Route path="/masters/job/categories" element={<JobCategoriesPage />} />
            <Route
              path="/masters/job/contract-durations"
              element={<ContractDurationsPage />}
            />
            <Route path="/masters/documents/types" element={<DocumentTypesPage />} />
            <Route
              path="/masters/payments/categories"
              element={<PaymentCategoriesPage />}
            />
            <Route path="/admin/menu-management" element={<MenuManagementPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs-preview" element={<JobsPreviewPage />} />
            <Route path="/recruitment/applications" element={<RecruitmentApplicationsPage />} />
            <Route path="/recruitment/candidates" element={<RecruitmentCandidatesPage />} />
            <Route path="/candidate/jobs" element={<CandidateJobsPage />} />
            <Route path="/candidate/applications" element={<CandidateApplicationsPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            {(mode === "opd" || mode === "all") && OpdDashboard && (
              <Route path="/opd" element={<OpdDashboard />} />
            )}

            {(mode === "ipd" || mode === "all") && IpdDashboard && (
              <Route path="/ipd" element={<IpdDashboard />} />
            )}
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
