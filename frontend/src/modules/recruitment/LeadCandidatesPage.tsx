import RecruitmentCandidatesPage from "./RecruitmentCandidatesPage";

export default function LeadCandidatesPage() {
  return (
    <RecruitmentCandidatesPage
      title="Lead Candidate"
      subtitle="Unverified candidates only"
      forceVerificationFilter="unverified"
      hideVerificationFilter
      hideAddCandidate
      rowActionMode="verify-only"
    />
  );
}
