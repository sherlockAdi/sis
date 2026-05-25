import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { getPartnerByUserId } from '../../services/partnerService';

type PartnerApplicationRow = {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  trade_test_required?: 0 | 1 | boolean | null;
  application_date: string | null;
  status: string | null;
};

@Route('partner/applications')
@Tags('Partner')
export class PartnerApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<PartnerApplicationRow[]> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const partner = await getPartnerByUserId(user.user_id);
    if (!partner?.partner_id) throw httpError(403, 'Partner profile not found');

    return callProc<RowDataPacket & PartnerApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, :partner_id)`,
      { partner_id: partner.partner_id }
    );
  }
}
