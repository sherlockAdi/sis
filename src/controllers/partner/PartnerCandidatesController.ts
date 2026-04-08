import { Controller, Get, Path, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { getPartnerByUserId } from '../../services/partnerService';

type PartnerCandidateRow = {
  candidate_id: number;
  candidate_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  passport_number: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  status: string | null;
  user_id: number | null;
  created_at: string;
};

type CandidateDocumentRow = {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  file_path: string | null;
  uploaded_at: string | null;
};

type PartnerApplicationRow = {
  application_id: number;
  candidate_id: number;
};

@Route('partner/candidates')
@Tags('Partner')
export class PartnerCandidatesController extends Controller {
  @Get('{candidateId}')
  @Security('jwt')
  public async get(@Path() candidateId: number, @Request() req: any): Promise<{ candidate: PartnerCandidateRow; documents: CandidateDocumentRow[] }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const partner = await getPartnerByUserId(user.user_id);
    if (!partner?.partner_id) throw httpError(403, 'Partner profile not found');

    const apps = await callProc<RowDataPacket & PartnerApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, :partner_id)`,
      { partner_id: partner.partner_id }
    );
    if (!apps.some((a) => Number(a.candidate_id) === Number(candidateId))) {
      throw httpError(403, 'Forbidden');
    }

    const candRows = await callProc<RowDataPacket & PartnerCandidateRow>(
      `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { candidate_id: candidateId }
    );
    const candidate = candRows[0];
    if (!candidate) throw httpError(404, 'Candidate not found');

    const documents = await callProc<RowDataPacket & CandidateDocumentRow>(
      `CALL sp_rec_candidate_documents('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL)`,
      { candidate_id: candidateId }
    );

    return { candidate, documents };
  }
}
