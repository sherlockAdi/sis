import { Body, Controller, Post, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type OtpCreateRequest = {
  user_id?: number | null;
  contact?: string | null;
  otp_type?: string | null;
  expires_in_minutes?: number | null;
};

type OtpCreateResponse = {
  otp_id: number;
  otp_code: string;
  expires_at: string;
};

type OtpVerifyRequest = {
  otp_id: number;
  otp_code: string;
};

function toMysqlDatetime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

function generateOtpCode(len = 6): string {
  let code = '';
  for (let i = 0; i < len; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

@Route('otps')
@Tags('OTPs')
export class OtpsController extends Controller {
  @Post()
  @Security('jwt')
  public async create(@Body() body: OtpCreateRequest): Promise<OtpCreateResponse> {
    const otp_code = generateOtpCode(6);
    const minutes = body.expires_in_minutes ?? 10;
    const expires_at = toMysqlDatetime(new Date(Date.now() + minutes * 60_000));

    const rows = await callProc<RowDataPacket & { otp_id: number }>(
      `CALL sp_otps_create(:user_id, :contact, :otp_code, :otp_type, :expires_at)`,
      {
        user_id: body.user_id ?? null,
        contact: body.contact ?? null,
        otp_code,
        otp_type: body.otp_type ?? null,
        expires_at
      }
    );

    const otp_id = rows[0]?.otp_id;
    if (!otp_id) throw httpError(500, 'Failed to create OTP');
    return { otp_id, otp_code, expires_at };
  }

  @Post('verify')
  @Security('jwt')
  public async verify(@Body() body: OtpVerifyRequest): Promise<{ verified: true }> {
    const rows = await callProc<
      RowDataPacket & { otp_id: number; is_verified: 0 | 1; expires_at: string; otp_code: string }
    >(`CALL sp_otps_get(:otp_id)`, { otp_id: body.otp_id });
    const otp = rows[0];
    if (!otp) throw httpError(404, 'OTP not found');
    if (otp.is_verified) throw httpError(409, 'OTP already verified');

    if (new Date(otp.expires_at).getTime() < Date.now()) throw httpError(410, 'OTP expired');

    if (otp.otp_code !== body.otp_code) throw httpError(401, 'Invalid OTP');

    const updated = await callProc<RowDataPacket & { affected_rows: number }>(`CALL sp_otps_mark_verified(:otp_id)`, {
      otp_id: body.otp_id
    });
    if ((updated[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'OTP not found');

    return { verified: true };
  }
}
