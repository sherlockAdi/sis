import { Controller, Get, Query, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { getOrCreateAssociatePartnerByUserId, getRoleCodeForUserId } from '../../services/associatePartnerService';

type AssociateApplicationRow = {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  application_date: string | null;
  status: string | null;
};

async function requireAssociatePartner(req: any) {
  const user = (req as any).user as { user_id?: number } | undefined;
  if (!user?.user_id) throw httpError(401, 'Unauthorized');

  const roleCode = String(await getRoleCodeForUserId(user.user_id)).toUpperCase();
  if (roleCode !== 'ASSOCIATE' && roleCode !== 'SOURCING') {
    throw httpError(403, 'Associate partner access required');
  }

  const associatePartner = await getOrCreateAssociatePartnerByUserId(user.user_id);
  if (!associatePartner?.associate_partner_id) throw httpError(403, 'Associate partner profile not found');
  return associatePartner;
}

@Route('associate/applications')
@Tags('Associate')
export class AssociateApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(
    @Request() req: any,
    @Query() status?: string,
    @Query() candidate_id?: number,
    @Query() job_id?: number
  ): Promise<AssociateApplicationRow[]> {
    const associatePartner = await requireAssociatePartner(req);
    return callProc<RowDataPacket & AssociateApplicationRow>(
      `CALL sp_rec_associate_applications('LIST_BY_ASSOCIATE_PARTNER', NULL, :associate_partner_id, :candidate_id, :job_id, :status)`,
      {
        associate_partner_id: associatePartner.associate_partner_id,
        candidate_id: typeof candidate_id === 'number' ? candidate_id : null,
        job_id: typeof job_id === 'number' ? job_id : null,
        status: status ?? null,
      }
    );
  }
}
