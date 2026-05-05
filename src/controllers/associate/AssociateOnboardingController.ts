import { Controller, Get, Query, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { getOrCreateAssociatePartnerByUserId, getRoleCodeForUserId } from '../../services/associatePartnerService';

type AssociateOnboardingOfferRow = {
  deployment_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  current_status: string | null;
  visa_type_id: number | null;
  visa_type_name: string | null;
  remarks: string | null;
  offer_date: string | null;
  offer_letter_file_path: string | null;
  isaccepted: number | null;
  offer_payment_received: number | null;
  offer_remarks: string | null;
  created_at: string;
  updated_at: string;
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

@Route('associate/onboarding')
@Tags('Associate')
export class AssociateOnboardingController extends Controller {
  @Get('download-offer')
  @Security('jwt')
  public async list(
    @Request() req: any,
    @Query() status?: string
  ): Promise<AssociateOnboardingOfferRow[]> {
    const associatePartner = await requireAssociatePartner(req);
    return callProc<RowDataPacket & AssociateOnboardingOfferRow>(
      `CALL sp_rec_associate_onboarding_offers('LIST_BY_ASSOCIATE_PARTNER', NULL, :associate_partner_id, :status)`,
      {
        associate_partner_id: associatePartner.associate_partner_id,
        status: status ?? null,
      }
    );
  }
}
