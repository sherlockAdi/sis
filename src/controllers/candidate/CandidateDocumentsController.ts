import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import type { JwtPayload } from '../../security/jwt';

type CandidateRow = {
  candidate_id: number;
  user_id: number | null;
};

type CandidateProfileDocumentRow = {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  document_name: string | null;
  file_path: string | null;
  uploaded_at: string | null;
};

function requireUser(req: any): JwtPayload {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user?.user_id) throw httpError(401, 'Unauthorized');
  if (!user?.username) throw httpError(401, 'Unauthorized');
  return user;
}

async function getCandidateIdForUser(user_id: number, username: string): Promise<number> {
  const rows = await callProc<RowDataPacket & CandidateRow>(
    `CALL sp_rec_candidates('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
    { user_id }
  );
  const candidate_id = rows[0]?.candidate_id;
  if (candidate_id) return candidate_id;
  throw httpError(
    404,
    `Candidate profile not found. Link this user to a candidate (user_id=${user_id}, username=${username}) via sp_rec_candidates('SET_USER', ...).`
  );
}

@Route('candidate/documents')
@Tags('Candidate')
export class CandidateDocumentsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<CandidateProfileDocumentRow[]> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    return callProc<RowDataPacket & CandidateProfileDocumentRow>(
      `CALL sp_rec_candidate_documents('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL)`,
      { candidate_id }
    );
  }
}
