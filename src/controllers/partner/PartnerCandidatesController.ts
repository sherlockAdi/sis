import { Controller, Get, Path, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
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
  country_name?: string | null;
  state_id: number | null;
  state_name?: string | null;
  city_id: number | null;
  city_name?: string | null;
  father_name?: string | null;
  address1?: string | null;
  address2?: string | null;
  pincode?: string | null;
  dob?: string | null;
  gender?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  industry_type?: string | null;
  resume_file_path?: string | null;
  passport_expiry_date?: string | null;
  passport_file_path?: string | null;
  aadhar_number?: string | null;
  aadhar_file_path?: string | null;
  pan_number?: string | null;
  pan_file_path?: string | null;
  voter_id_number?: string | null;
  voter_id_file_path?: string | null;
  profile_photo_file_path?: string | null;
  languages_known?: string | null;
  status: string | null;
  user_id: number | null;
  created_at: string;
  updated_at?: string | null;
};

type PartnerCandidateDocumentRow = {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  document_name?: string | null;
  file_path: string | null;
  uploaded_at: string | null;
};

type PartnerCandidateTradeLinkRow = {
  id: string;
  title: string;
  url: string;
};

type PartnerCandidateTradeTestRow = {
  candidate_id: number;
  trade_video_file_path: string | null;
  trade_video_file_name: string | null;
  trade_video_file_size: number | null;
  trade_video_uploaded_at: string | null;
  trade_video_links_json: string | null;
  created_at: string;
  updated_at: string;
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
  public async get(
    @Path() candidateId: number,
    @Request() req: any
  ): Promise<{ candidate: PartnerCandidateRow; documents: PartnerCandidateDocumentRow[]; trade_test: {
    candidate_id: number;
    trade_video_file_path: string | null;
    trade_video_file_name: string | null;
    trade_video_file_size: number | null;
    trade_video_uploaded_at: string | null;
    trade_video_links: PartnerCandidateTradeLinkRow[];
    created_at: string;
    updated_at: string;
  } }> {
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

    const documents = await callProc<RowDataPacket & PartnerCandidateDocumentRow>(
      `CALL sp_rec_candidate_documents('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL)`,
      { candidate_id: candidateId }
    );

    const [tradeRows] = await pool.query<(RowDataPacket & PartnerCandidateTradeTestRow)[]>(
      `SELECT candidate_id, trade_video_file_path, trade_video_file_name, trade_video_file_size, trade_video_uploaded_at, trade_video_links_json, created_at, updated_at
       FROM REC_T04_candidate_trade_tests
       WHERE candidate_id = :candidate_id
       LIMIT 1`,
      { candidate_id: candidateId }
    );

    const tradeRow = tradeRows[0];
    let tradeVideoLinks: PartnerCandidateTradeLinkRow[] = [];
    if (tradeRow?.trade_video_links_json) {
      try {
        const parsed = JSON.parse(tradeRow.trade_video_links_json);
        if (Array.isArray(parsed)) {
          tradeVideoLinks = parsed
            .map((item, index) => {
              if (typeof item === 'string') {
                const url = String(item ?? '').trim();
                return url ? { id: `link_${index}`, title: '', url } : null;
              }
              if (!item || typeof item !== 'object') return null;
              const row = item as PartnerCandidateTradeLinkRow;
              const url = String(row.url ?? '').trim();
              if (!url) return null;
              return {
                id: String(row.id ?? `link_${index}`),
                title: String(row.title ?? ''),
                url,
              };
            })
            .filter((item): item is PartnerCandidateTradeLinkRow => Boolean(item));
        }
      } catch {
        tradeVideoLinks = [];
      }
    }

    return {
      candidate,
      documents,
      trade_test: {
        candidate_id: tradeRow?.candidate_id ?? candidateId,
        trade_video_file_path: tradeRow?.trade_video_file_path ?? null,
        trade_video_file_name: tradeRow?.trade_video_file_name ?? null,
        trade_video_file_size: tradeRow?.trade_video_file_size === null || tradeRow?.trade_video_file_size === undefined ? null : Number(tradeRow.trade_video_file_size),
        trade_video_uploaded_at: tradeRow?.trade_video_uploaded_at ?? null,
        trade_video_links: tradeVideoLinks,
        created_at: tradeRow?.created_at ?? new Date(0).toISOString(),
        updated_at: tradeRow?.updated_at ?? new Date(0).toISOString(),
      },
    };
  }
}
