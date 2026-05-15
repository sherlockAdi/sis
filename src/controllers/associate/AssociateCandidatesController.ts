import { Body, Controller, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { env } from '../../config/env';
import { findExistingUserByUsernameOrEmail, hashPassword } from '../../services/authService';
import { getOrCreateAssociatePartnerByUserId, getRoleCodeForUserId } from '../../services/associatePartnerService';
import { getCandidateProfileMissingFields } from '../../utils/candidateProfileCompleteness';
import { httpError } from '../../utils/httpErrors';
import { sendSmtpMail } from '../../utils/smtpClient';
import { accountLinkedEmailHtml, accountLinkedEmailText, credentialsEmailHtml, credentialsEmailText } from '../../utils/emailTemplates';
import { sendStatusNotification } from '../../services/notificationService';

type AssociateCandidateRow = {
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
  is_verified: boolean | 0 | 1 | null;
  user_id: number | null;
  associate_partner_id: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type AssociateCandidateDocumentRow = {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  document_name?: string | null;
  file_path: string | null;
  uploaded_at: string | null;
};

type AssociateApplicationDocRow = {
  document_type_id: number | null;
  job_specific_document_id: number | null;
  document_name: string;
  job_is_required: 0 | 1;
  candidate_document_id: number | null;
  file_path: string | null;
  uploaded_at: string | null;
};

type AssociateJobDocRow = {
  id: number;
  application_id: number;
  job_specific_document_id: number;
  document_name: string;
  is_required: 0 | 1;
  file_path: string | null;
  uploaded_at: string | null;
};

type AssociateApplicationListRow = {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  status: string | null;
};

function normalizeCandidateRow(row: AssociateCandidateRow): AssociateCandidateRow {
  return {
    ...row,
    is_verified: Boolean(row.is_verified),
  };
}

function toNull(value: string | null | undefined): string | null {
  const v = String(value ?? '').trim();
  return v ? v : null;
}

function hasProfileDocument(candidate: AssociateCandidateRow, documentName: string): boolean {
  const name = String(documentName ?? '').toLowerCase();
  const rules: Array<{ keys: string[]; value: unknown }> = [
    { keys: ['resume', 'cv'], value: candidate.resume_file_path },
    { keys: ['passport'], value: candidate.passport_file_path },
    { keys: ['aadhar', 'aadhaar'], value: candidate.aadhar_file_path },
    { keys: ['pan'], value: candidate.pan_file_path },
    { keys: ['voter'], value: candidate.voter_id_file_path },
    { keys: ['photo', 'profile image', 'profile photo'], value: candidate.profile_photo_file_path },
  ];

  return rules.some((rule) => rule.keys.some((key) => name.includes(key)) && Boolean(String(rule.value ?? '').trim()));
}

function isApplicationDocumentSatisfied(candidate: AssociateCandidateRow, doc: AssociateApplicationDocRow): boolean {
  if (String(doc.file_path ?? '').trim()) return true;
  if (doc.document_type_id != null && hasProfileDocument(candidate, doc.document_name)) return true;
  return false;
}

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function resolveCandidateRoleId(): Promise<number> {
  const roleRows = await callProc<RowDataPacket & { role_id: number }>(
    `CALL sp_roles_get_by_code(:role_code)`,
    { role_code: 'CANDIDATE' }
  );

  let role_id = roleRows[0]?.role_id;
  if (!role_id) {
    const inserted = await callProc<RowDataPacket & { role_id: number }>(
      `CALL sp_roles_create(:role_name, :role_code, :description, :status)`,
      { role_name: 'Candidate', role_code: 'CANDIDATE', description: 'Candidate portal role', status: true }
    );
    role_id = inserted[0]?.role_id;
  }

  if (!role_id) throw httpError(500, 'Failed to resolve candidate role');
  return role_id;
}

async function requireAssociatePartner(req: any) {
  const user = (req as any).user as { user_id?: number } | undefined;
  if (!user?.user_id) throw httpError(401, 'Unauthorized');

  const roleCode = String(await getRoleCodeForUserId(user.user_id)).toUpperCase();
  if (roleCode !== 'ASSOCIATE' && roleCode !== 'SOURCING') {
    throw httpError(403, 'Associate partner access required');
  }

  const associatePartner = await getOrCreateAssociatePartnerByUserId(user.user_id);
  if (!associatePartner?.associate_partner_id) throw httpError(403, 'Associate partner profile not found');
  return { user_id: user.user_id, associatePartner };
}

async function linkCandidateUser(candidate_id: number, associate_partner_id: number, user_id: number, email?: string | null, phone?: string | null, status?: string | null): Promise<void> {
  const rows = await callProc<RowDataPacket & { affected_rows: number }>(
    `CALL sp_rec_associate_candidates('SET_USER', :candidate_id, :associate_partner_id, NULL, NULL, :phone, :email, NULL, NULL, NULL, NULL, :status, :user_id, NULL)`,
    {
      candidate_id,
      associate_partner_id,
      user_id,
      email: email ?? null,
      phone: phone ?? null,
      status: status ?? 'Ready',
    }
  );
  if ((rows[0]?.affected_rows ?? 0) === 0) {
    throw httpError(500, 'Failed to link candidate to user');
  }
}

async function getAssociateApplication(application_id: number): Promise<{ application_id: number; candidate_id: number; job_id: number; status: string | null }> {
  const rows = await callProc<RowDataPacket & { application_id: number; candidate_id: number; job_id: number; status: string | null }>(
    `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
    { application_id }
  );
  const application = rows[0];
  if (!application) throw httpError(404, 'Application not found');
  return application;
}

async function getAssociateApplicationDetail(application_id: number, candidate_id: number): Promise<AssociateApplicationListRow | null> {
  const rows = await callProc<RowDataPacket & AssociateApplicationListRow>(
    `CALL sp_rec_applications('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL, NULL)`,
    { candidate_id }
  );
  return rows.find((row) => Number(row.application_id) === Number(application_id)) ?? null;
}

async function upsertAssociateCandidateProfile(
  candidate_id: number,
  associate_partner_id: number,
  body: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
    passport_number?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
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
    is_verified?: boolean | null;
    status?: string | null;
  }
): Promise<void> {
  await callProc<RowDataPacket & { affected_rows: number }>(
    `CALL sp_rec_associate_candidates('UPDATE', :candidate_id, :associate_partner_id, :first_name, :last_name, :phone, :email, :passport_number, :country_id, :state_id, :city_id, :status, NULL, :is_verified)`,
    {
      candidate_id,
      associate_partner_id,
      first_name: toNull(body.first_name),
      last_name: toNull(body.last_name),
      phone: toNull(body.phone),
      email: toNull(body.email),
      passport_number: toNull(body.passport_number),
      country_id: typeof body.country_id === 'number' ? body.country_id : null,
      state_id: typeof body.state_id === 'number' ? body.state_id : null,
      city_id: typeof body.city_id === 'number' ? body.city_id : null,
      status: body.status ?? null,
      is_verified: typeof body.is_verified === 'boolean' ? body.is_verified : null,
    }
  );

  await callProc<RowDataPacket & { affected_rows: number }>(
    `CALL sp_rec_candidate_profiles('UPSERT', :candidate_id, :father_name, :address1, :address2, :pincode, :dob, :gender, :skills, :education, :experience, :industry_type, :resume_file_path, :passport_expiry_date, :passport_file_path, :aadhar_number, :aadhar_file_path, :pan_number, :pan_file_path, :voter_id_number, :voter_id_file_path, :profile_photo_file_path, :languages_known)`,
    {
      candidate_id,
      father_name: toNull(body.father_name),
      address1: toNull(body.address1),
      address2: toNull(body.address2),
      pincode: toNull(body.pincode),
      dob: body.dob ?? null,
      gender: toNull(body.gender),
      skills: toNull(body.skills),
      education: toNull(body.education),
      experience: toNull(body.experience),
      industry_type: toNull(body.industry_type),
      resume_file_path: toNull(body.resume_file_path),
      passport_expiry_date: body.passport_expiry_date ?? null,
      passport_file_path: toNull(body.passport_file_path),
      aadhar_number: toNull(body.aadhar_number),
      aadhar_file_path: toNull(body.aadhar_file_path),
      pan_number: toNull(body.pan_number),
      pan_file_path: toNull(body.pan_file_path),
      voter_id_number: toNull(body.voter_id_number),
      voter_id_file_path: toNull(body.voter_id_file_path),
      profile_photo_file_path: toNull(body.profile_photo_file_path),
      languages_known: toNull(body.languages_known),
    }
  );
}

async function getAssociateCandidate(candidate_id: number, associate_partner_id: number): Promise<AssociateCandidateRow> {
  const rows = await callProc<RowDataPacket & AssociateCandidateRow>(
    `CALL sp_rec_associate_candidates('GET', :candidate_id, :associate_partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
    { candidate_id, associate_partner_id }
  );
  const candidate = rows[0] ? normalizeCandidateRow(rows[0]) : undefined;
  if (!candidate) throw httpError(404, 'Candidate not found');
  return candidate;
}

@Route('associate/candidates')
@Tags('Associate')
export class AssociateCandidatesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<AssociateCandidateRow[]> {
    const { associatePartner } = await requireAssociatePartner(req);
    const rows = await callProc<RowDataPacket & AssociateCandidateRow>(
      `CALL sp_rec_associate_candidates('LIST', NULL, :associate_partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { associate_partner_id: associatePartner.associate_partner_id }
    );
    return rows.map((row) => normalizeCandidateRow(row));
  }

  @Get('{candidateId}')
  @Security('jwt')
  public async get(@Path() candidateId: number, @Request() req: any): Promise<{ candidate: AssociateCandidateRow; documents: AssociateCandidateDocumentRow[] }> {
    const { associatePartner } = await requireAssociatePartner(req);
    const candidate = await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);

    const documents = await callProc<RowDataPacket & AssociateCandidateDocumentRow>(
      `CALL sp_rec_candidate_documents('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL)`,
      { candidate_id: candidateId }
    );

    return { candidate, documents };
  }

  @Get('{candidateId}/documents')
  @Security('jwt')
  public async listDocuments(@Path() candidateId: number, @Request() req: any): Promise<AssociateCandidateDocumentRow[]> {
    const { associatePartner } = await requireAssociatePartner(req);
    await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);
    return callProc<RowDataPacket & AssociateCandidateDocumentRow>(
      `CALL sp_rec_candidate_documents('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL)`,
      { candidate_id: candidateId }
    );
  }

  @Put('{candidateId}/documents/{documentTypeId}')
  @Security('jwt')
  public async upsertDocument(
    @Path() candidateId: number,
    @Path() documentTypeId: number,
    @Body() body: { file_path: string },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const { associatePartner } = await requireAssociatePartner(req);
    await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);

    const file_path = String(body?.file_path ?? '').trim();
    if (!file_path) throw httpError(400, 'file_path is required');

    await callProc(
      `CALL sp_rec_candidate_documents('UPSERT', NULL, :candidate_id, :document_type_id, :file_path)`,
      {
        candidate_id: candidateId,
        document_type_id: documentTypeId,
        file_path,
      }
    );

    return { updated: true };
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body()
    body: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email?: string | null;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
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
    },
    @Request() req: any
  ): Promise<{
    candidate_id: number;
    username: string;
    emailed: boolean;
    user_id: number | null;
    user_created: boolean;
    existing_user_used: boolean;
    auth_error?: string | null;
  }> {
    const { associatePartner } = await requireAssociatePartner(req);
    const first_name = String(body.first_name ?? '').trim();
    const last_name = String(body.last_name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const email = String(body.email ?? '').trim();
    const passport_number = String(body.passport_number ?? '').trim();

    const rows = await callProc<RowDataPacket & { candidate_id: number }>(
      `CALL sp_rec_associate_candidates('CREATE', NULL, :associate_partner_id, :first_name, :last_name, :phone, :email, :passport_number, :country_id, :state_id, :city_id, :status, NULL, :is_verified)`,
      {
        associate_partner_id: associatePartner.associate_partner_id,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        email: email || null,
        passport_number: passport_number || null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        status: 'Associate Draft',
        is_verified: true,
      }
    );

    const candidate_id = rows[0]?.candidate_id;
    if (!candidate_id) throw httpError(500, 'Failed to create candidate');

    await upsertAssociateCandidateProfile(candidate_id, associatePartner.associate_partner_id, body);
    const candidate = await getAssociateCandidate(candidate_id, associatePartner.associate_partner_id);
    const username = candidate.candidate_code ?? `cand${candidate_id}`;
    return { candidate_id, username, emailed: false, user_id: null, user_created: false, existing_user_used: false };
  }

  @Put('{candidateId}')
  @Security('jwt')
  public async update(
    @Path() candidateId: number,
    @Body()
    body: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email?: string | null;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
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
      is_verified?: boolean | null;
      status?: string | null;
    },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const { associatePartner } = await requireAssociatePartner(req);
    await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);
    await upsertAssociateCandidateProfile(candidateId, associatePartner.associate_partner_id, body);
    return { updated: true };
  }

  @Put('{candidateId}/finalize')
  @Security('jwt')
  public async finalize(
    @Path() candidateId: number,
    @Body() body: { original_email: string; original_phone: string },
    @Request() req: any
  ): Promise<{
    candidate_id: number;
    username: string;
    emailed: boolean;
    user_id: number | null;
    user_created: boolean;
    existing_user_used: boolean;
    auth_error?: string | null;
  }> {
    const { associatePartner } = await requireAssociatePartner(req);
    const candidate = await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);

    const original_email = String(body.original_email ?? '').trim();
    const original_phone = String(body.original_phone ?? '').trim();
    if (!original_email) throw httpError(400, 'original_email is required');
    if (!original_phone) throw httpError(400, 'original_phone is required');

    const username = candidate.candidate_code ?? `cand${candidateId}`;
    const role_id = await resolveCandidateRoleId();
    const existingUser = await findExistingUserByUsernameOrEmail(username, original_email);
    let user_id: number | null = existingUser?.user_id ?? null;
    let user_created = false;
    const existing_user_used = Boolean(existingUser);
    let auth_error: string | null = null;
    let emailed = false;
    let plainPassword: string | null = randomPassword(10);

    try {
      if (existingUser) {
        const updateRows = await callProc<RowDataPacket & { affected_rows: number }>(
          `CALL sp_users_update(:user_id, :role_id, :first_name, :last_name, :username, :email, :phone, :password_hash, NULL)`,
          {
            user_id,
            role_id,
            first_name: candidate.first_name ?? null,
            last_name: candidate.last_name ?? null,
            username,
            email: original_email,
            phone: original_phone,
            password_hash: await hashPassword(plainPassword),
          }
        );
        if ((updateRows[0]?.affected_rows ?? 0) === 0) {
          throw httpError(500, 'Failed to update existing user login');
        }
      } else {
        const password_hash = await hashPassword(plainPassword);
        const userRows = await callProc<RowDataPacket & { user_id: number }>(
          `CALL sp_users_create(:role_id, :first_name, :last_name, :username, :email, :phone, :password_hash, :status)`,
          {
            role_id,
            first_name: candidate.first_name ?? null,
            last_name: candidate.last_name ?? null,
            username,
            email: original_email,
            phone: original_phone,
            password_hash,
            status: true,
          }
        );
        user_id = userRows[0]?.user_id ?? null;
        user_created = Boolean(user_id);
      }

      if (!user_id) throw httpError(500, 'Failed to create or resolve user');

      await linkCandidateUser(candidateId, associatePartner.associate_partner_id, user_id, original_email, original_phone, 'Ready');
      await upsertAssociateCandidateProfile(candidateId, associatePartner.associate_partner_id, {
        email: original_email,
        phone: original_phone,
        status: 'Ready',
        is_verified: true,
      });

      if (original_email && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
        try {
          const mailText = existingUser
            ? accountLinkedEmailText({
                name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
                username,
                temporaryPassword: plainPassword,
                portalLabel: 'Candidate',
              })
            : credentialsEmailText({
                name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
                username,
                temporaryPassword: plainPassword,
                portalLabel: 'Candidate',
              });
          const mailHtml = existingUser
            ? accountLinkedEmailHtml({
                name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
                username,
                temporaryPassword: plainPassword,
                portalLabel: 'Candidate',
              })
            : credentialsEmailHtml({
                name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
                username,
                temporaryPassword: plainPassword,
                portalLabel: 'Candidate',
              });

          await sendSmtpMail(
            {
              host: env.SMTP_HOST,
              port: env.SMTP_PORT,
              secure: env.SMTP_SECURE,
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
              from: env.SMTP_FROM,
            },
            {
              to: original_email,
              subject: existingUser
                ? 'SIS Global Connect - Candidate account updated'
                : 'SIS Global Connect - Candidate account confirmed',
              text: mailText,
              html: mailHtml,
            }
          );
          emailed = true;
        } catch {
          emailed = false;
        }
      }
    } catch (e: any) {
      auth_error = String(e?.message ?? 'Failed to finalize candidate');
    }

    return { candidate_id: candidateId, username, emailed, user_id, user_created, existing_user_used, auth_error };
  }

  @Post('{candidateId}/applications')
  @Security('jwt')
  public async applyJob(
    @Path() candidateId: number,
    @Body() body: { job_id: number; application_date?: string | null; status?: string | null },
    @Request() req: any
  ): Promise<{ application_id: number }> {
    const { associatePartner } = await requireAssociatePartner(req);
    const candidate = await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);
    if (!candidate.candidate_id) throw httpError(404, 'Candidate not found');

    const job_id = Number((body as any)?.job_id);
    if (!job_id) throw httpError(400, 'job_id is required');

    const rows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('CREATE', NULL, :candidate_id, :job_id, :application_date, :status, NULL)`,
      {
        candidate_id: candidateId,
        job_id,
        application_date: body.application_date ?? null,
        status: body.status ?? 'Draft',
      }
    );
    const application_id = rows[0]?.application_id;
    if (!application_id) throw httpError(500, 'Failed to create application');
    return { application_id };
  }

  @Get('{candidateId}/applications/{applicationId}/documents')
  @Security('jwt')
  public async applicationDocuments(
    @Path() candidateId: number,
    @Path() applicationId: number,
    @Request() req: any
  ): Promise<{ application: { application_id: number; candidate_id: number; job_id: number; status: string | null }; documents: AssociateApplicationDocRow[]; job_documents: AssociateJobDocRow[] }> {
    const { associatePartner } = await requireAssociatePartner(req);
    await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);
    const application = await getAssociateApplication(applicationId);
    if (Number(application.candidate_id) !== Number(candidateId)) throw httpError(403, 'Forbidden');

    const [documents, job_documents] = await Promise.all([
      callProc<RowDataPacket & AssociateApplicationDocRow>(
        `CALL sp_rec_application_documents(:application_id)`,
        { application_id: applicationId }
      ),
      callProc<RowDataPacket & AssociateJobDocRow>(
        `CALL sp_rec_application_job_documents('LIST_BY_APPLICATION', NULL, :application_id, NULL, NULL)`,
        { application_id: applicationId }
      ),
    ]);

    return { application, documents, job_documents };
  }

  @Put('{candidateId}/applications/{applicationId}/documents/{documentTypeId}')
  @Security('jwt')
  public async upsertApplicationDocument(
    @Path() candidateId: number,
    @Path() applicationId: number,
    @Path() documentTypeId: number,
    @Body() body: { file_path: string },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const { associatePartner } = await requireAssociatePartner(req);
    const candidate = await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);
    const application = await getAssociateApplication(applicationId);
    if (Number(application.candidate_id) !== Number(candidate.candidate_id)) throw httpError(403, 'Forbidden');

    const file_path = String(body?.file_path ?? '').trim();
    if (!file_path) throw httpError(400, 'file_path is required');

    await callProc(
      `CALL sp_rec_candidate_documents('UPSERT', NULL, :candidate_id, :document_type_id, :file_path)`,
      {
        candidate_id: candidateId,
        document_type_id: documentTypeId,
        file_path,
      }
    );

    return { updated: true };
  }

  @Put('{candidateId}/applications/{applicationId}/job-documents/{jobSpecificDocumentId}')
  @Security('jwt')
  public async upsertApplicationJobDocument(
    @Path() candidateId: number,
    @Path() applicationId: number,
    @Path() jobSpecificDocumentId: number,
    @Body() body: { file_path: string },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const { associatePartner } = await requireAssociatePartner(req);
    const candidate = await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);
    const application = await getAssociateApplication(applicationId);
    if (Number(application.candidate_id) !== Number(candidate.candidate_id)) throw httpError(403, 'Forbidden');

    const file_path = String(body?.file_path ?? '').trim();
    if (!file_path) throw httpError(400, 'file_path is required');

    await callProc(
      `CALL sp_rec_application_job_documents('UPSERT', NULL, :application_id, :job_specific_document_id, :file_path)`,
      {
        application_id: applicationId,
        job_specific_document_id: jobSpecificDocumentId,
        file_path,
      }
    );

    return { updated: true };
  }

  @Post('{candidateId}/applications/{applicationId}/submit')
  @Security('jwt')
  public async submitApplication(
    @Path() candidateId: number,
    @Path() applicationId: number,
    @Request() req: any
  ): Promise<{ submitted: true }> {
    const { associatePartner } = await requireAssociatePartner(req);
    const candidate = await getAssociateCandidate(candidateId, associatePartner.associate_partner_id);
    const application = await getAssociateApplication(applicationId);
    if (Number(application.candidate_id) !== Number(candidate.candidate_id)) throw httpError(403, 'Forbidden');

    const missingFields = getCandidateProfileMissingFields(candidate);
    if (missingFields.length) {
      throw httpError(400, `Complete the candidate profile before applying. Missing: ${missingFields.join(', ')}`);
    }

    const [applicationDocs, jobDocs] = await Promise.all([
      callProc<RowDataPacket & AssociateApplicationDocRow>(
        `CALL sp_rec_application_documents(:application_id)`,
        { application_id: applicationId }
      ),
      callProc<RowDataPacket & AssociateJobDocRow>(
        `CALL sp_rec_application_job_documents('LIST_BY_APPLICATION', NULL, :application_id, NULL, NULL)`,
        { application_id: applicationId }
      ),
    ]);

    const missingStandardDocs = applicationDocs.filter((doc) => Number(doc.job_is_required) === 1 && !isApplicationDocumentSatisfied(candidate, doc));
    const missingJobDocs = jobDocs.filter((doc) => Number(doc.is_required) === 1 && !String(doc.file_path ?? '').trim());

    const missingLabels = [
      ...missingStandardDocs.map((doc) => doc.document_name).filter(Boolean),
      ...missingJobDocs.map((doc) => doc.document_name).filter(Boolean),
    ];

    if (missingLabels.length) {
      throw httpError(400, `Upload all required documents before applying: ${missingLabels.join(', ')}`);
    }

    await callProc(
      `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, :status, NULL)`,
      { application_id: applicationId, status: 'Applied' }
    );

    const appDetail = await getAssociateApplicationDetail(applicationId, candidate.candidate_id);
    if (appDetail) {
      await sendStatusNotification({
        recipient: {
          name: appDetail.candidate_name,
          email: appDetail.email,
          phone: appDetail.phone,
          whatsapp: appDetail.phone,
        },
        subject: `${appDetail.job_title} - Application submitted`,
        headline: 'Job applied',
        statusLabel: String(appDetail.status ?? 'Applied'),
        greeting: `Hello ${appDetail.candidate_name},`,
        summary: `Your application for ${appDetail.job_title} has been submitted successfully.`,
        rows: [
          { label: 'Application ID', value: String(appDetail.application_id) },
          { label: 'Job', value: String(appDetail.job_title) },
          { label: 'Candidate', value: String(appDetail.candidate_name) },
          { label: 'Current Status', value: String(appDetail.status ?? 'Applied') },
        ],
        nextSteps: ['Track the application status in your candidate portal.'],
      });
    }

    return { submitted: true };
  }
}
