import { Body, Controller, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import type { JwtPayload } from '../../security/jwt';
import { getCandidateProfileMissingFields, type CandidateProfileLike } from '../../utils/candidateProfileCompleteness';
import { sendStatusNotification } from '../../services/notificationService';

type CandidateRow = {
  candidate_id: number;
  user_id: number | null;
};

type CandidateProfileRow = CandidateProfileLike & {
  candidate_id: number;
  user_id: number | null;
};

function normalizeCandidate(row: CandidateProfileRow): CandidateProfileRow {
  return {
    ...row,
    is_verified: Boolean((row as any).is_verified),
  } as CandidateProfileRow;
}

type CandidateApplicationRow = {
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

type CandidateApplicationDocRow = {
  document_type_id: number | null;
  job_specific_document_id: number | null;
  document_name: string;
  job_is_required: 0 | 1;
  candidate_document_id: number | null;
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

  // Keep message actionable while still using only the stored procedure lookup.
  throw httpError(
    404,
    `Candidate profile not found. Link this user to a candidate (user_id=${user_id}, username=${username}) via sp_rec_candidates('SET_USER', ...).`
  );
}

async function getCandidateProfileForUser(user_id: number, username: string): Promise<CandidateProfileRow> {
  const rows = await callProc<RowDataPacket & CandidateProfileRow>(
    `CALL sp_rec_candidates('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
    { user_id }
  );
  const candidate = rows[0] as CandidateProfileRow | undefined;
  if (!candidate) {
    throw httpError(
      404,
      `Candidate profile not found. Link this user to a candidate (user_id=${user_id}, username=${username}) via sp_rec_candidates('SET_USER', ...).`
    );
  }
  return normalizeCandidate(candidate);
}

async function assertOwnsApplication(application_id: number, candidate_id: number): Promise<void> {
  const appRows = await callProc<RowDataPacket & { candidate_id: number }>(
    `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
    { application_id }
  );
  const appCandidateId = appRows[0]?.candidate_id;
  if (!appCandidateId) throw httpError(404, 'Application not found');
  if (appCandidateId !== candidate_id) throw httpError(403, 'Forbidden');
}

async function assertCandidateProfileComplete(candidate_id: number): Promise<void> {
  const candidateRows = await callProc<RowDataPacket & CandidateProfileRow>(
    `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
    { candidate_id }
  );
  const candidate = candidateRows[0] as CandidateProfileRow | undefined;
  if (!candidate) throw httpError(404, 'Candidate profile not found');
  const missingFields = getCandidateProfileMissingFields(normalizeCandidate(candidate));
  if (missingFields.length) {
    throw httpError(400, `Complete your profile before applying. Missing: ${missingFields.join(', ')}`);
  }
}

async function assertCandidateVerified(candidate_id: number): Promise<void> {
  const candidateRows = await callProc<RowDataPacket & CandidateProfileRow>(
    `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
    { candidate_id }
  );
  const candidate = candidateRows[0] as CandidateProfileRow | undefined;
  if (!candidate) throw httpError(404, 'Candidate profile not found');
  const normalized = normalizeCandidate(candidate);
  if (!Boolean((normalized as any).is_verified)) {
    throw httpError(403, 'Your profile is awaiting admin verification');
  }
}

function hasProfileDocument(candidate: CandidateProfileLike, documentName: string): boolean {
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

function isDocumentSatisfied(candidate: CandidateProfileLike, doc: CandidateApplicationDocRow): boolean {
  if (String(doc.file_path ?? '').trim()) return true;
  if (doc.document_type_id != null && hasProfileDocument(candidate, doc.document_name)) return true;
  return false;
}

@Route('candidate/applications')
@Tags('Candidate')
export class CandidateApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<CandidateApplicationRow[]> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    return callProc<RowDataPacket & CandidateApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL, NULL)`,
      { candidate_id }
    );
  }

  @Get('{applicationId}')
  @Security('jwt')
  public async get(@Request() req: any, @Path() applicationId: number): Promise<CandidateApplicationRow> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);

    const rows = await callProc<RowDataPacket & CandidateApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL, NULL)`,
      { candidate_id }
    );
    const row = rows.find((r) => Number(r.application_id) === Number(applicationId));
    if (!row) throw httpError(404, 'Application not found');
    return row;
  }

  @Post('start')
  @Security('jwt')
  public async start(@Request() req: any, @Body() body: { job_id: number }): Promise<{ application_id: number }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertCandidateVerified(candidate_id);
    await assertCandidateProfileComplete(candidate_id);
    const job_id = Number((body as any)?.job_id);
    if (!job_id) throw httpError(400, 'job_id is required');

    const rows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('CREATE', NULL, :candidate_id, :job_id, NULL, :status, NULL)`,
      { candidate_id, job_id, status: 'Draft' }
    );
    const application_id = rows[0]?.application_id;
    if (!application_id) throw httpError(500, 'Failed to create application');
    return { application_id };
  }

  @Post('{applicationId}/submit')
  @Security('jwt')
  public async submit(
    @Request() req: any,
    @Path() applicationId: number,
    @Body() body: { consent: true }
  ): Promise<{ submitted: true }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);
    await assertCandidateVerified(candidate_id);
    await assertCandidateProfileComplete(candidate_id);

    const consent = Boolean((body as any)?.consent);
    if (!consent) throw httpError(400, 'Consent is required');

    const candidate = await getCandidateProfileForUser(user.user_id, user.username);
    const docs = await callProc<RowDataPacket & CandidateApplicationDocRow>(
      `CALL sp_rec_application_documents(:application_id)`,
      { application_id: applicationId }
    );
    const missing = docs.filter((d) => Number(d.job_is_required) === 1 && !isDocumentSatisfied(candidate, d));
    if (missing.length) {
      const missingLabels = missing.map((d) => d.document_name).filter(Boolean);
      throw httpError(
        400,
        missingLabels.length
          ? `Upload all required documents before applying: ${missingLabels.join(', ')}`
          : 'Upload all required documents before applying'
      );
    }

    await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, :status, NULL)`,
      { application_id: applicationId, status: 'Applied' }
    );

    const updatedRows = await callProc<RowDataPacket & CandidateApplicationRow>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    const updated = updatedRows[0];
    if (updated) {
      await sendStatusNotification({
        recipient: {
          name: updated.candidate_name,
          email: updated.email,
          phone: updated.phone,
          whatsapp: updated.phone,
        },
        subject: `${updated.job_title} - ${String(updated.status ?? 'Applied')}`,
        headline: 'Application submitted',
        statusLabel: String(updated.status ?? 'Applied'),
        greeting: `Hello ${updated.candidate_name},`,
        summary: `Your application for ${updated.job_title} has been submitted successfully.`,
        rows: [
          { label: 'Application ID', value: String(updated.application_id) },
          { label: 'Job', value: String(updated.job_title) },
          { label: 'Candidate', value: String(updated.candidate_name) },
          { label: 'Current Status', value: String(updated.status ?? 'Applied') },
        ],
        nextSteps: ['Track the application status in your candidate portal.'],
        referenceCandidateId: updated.candidate_id,
      });
    }

    return { submitted: true };
  }

  @Post('apply')
  @Security('jwt')
  public async apply(@Request() req: any, @Body() body: { job_id: number }): Promise<{ application_id: number }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertCandidateVerified(candidate_id);
    await assertCandidateProfileComplete(candidate_id);
    const job_id = Number((body as any)?.job_id);
    if (!job_id) throw httpError(400, 'job_id is required');

    const rows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('CREATE', NULL, :candidate_id, :job_id, NULL, NULL, NULL)`,
      { candidate_id, job_id }
    );
    const application_id = rows[0]?.application_id;
    if (!application_id) throw httpError(500, 'Failed to create application');

    const appRows = await callProc<RowDataPacket & CandidateApplicationRow>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
      { application_id }
    );
    const app = appRows[0];
    if (app) {
      await sendStatusNotification({
        recipient: {
          name: app.candidate_name,
          email: app.email,
          phone: app.phone,
          whatsapp: app.phone,
        },
        subject: `${app.job_title} - Application submitted`,
        headline: 'Job applied',
        statusLabel: String(app.status ?? 'Applied'),
        greeting: `Hello ${app.candidate_name},`,
        summary: `Your application for ${app.job_title} has been created successfully.`,
        rows: [
          { label: 'Application ID', value: String(app.application_id) },
          { label: 'Job', value: String(app.job_title) },
          { label: 'Candidate', value: String(app.candidate_name) },
          { label: 'Current Status', value: String(app.status ?? 'Applied') },
        ],
        nextSteps: ['Continue tracking the application from your candidate portal.'],
        referenceCandidateId: app.candidate_id,
      });
    }
    return { application_id };
  }

  @Get('{applicationId}/documents')
  @Security('jwt')
  public async documents(@Request() req: any, @Path() applicationId: number): Promise<CandidateApplicationDocRow[]> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);
    return callProc<RowDataPacket & CandidateApplicationDocRow>(
      `CALL sp_rec_application_documents(:application_id)`,
      { application_id: applicationId }
    );
  }

  @Put('{applicationId}/documents/{documentTypeId}')
  @Security('jwt')
  public async upsertDocument(
    @Request() req: any,
    @Path() applicationId: number,
    @Path() documentTypeId: number,
    @Body() body: { file_path: string }
  ): Promise<{ updated: true }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);

    const file_path = String(body?.file_path ?? '').trim();
    if (!file_path) throw httpError(400, 'file_path is required');

    await callProc(
      `CALL sp_rec_candidate_documents('UPSERT', NULL, :candidate_id, :document_type_id, :file_path)`,
      {
        candidate_id,
        document_type_id: documentTypeId,
        file_path
      }
    );

    return { updated: true };
  }

  @Put('{applicationId}/job-documents/{jobSpecificDocumentId}')
  @Security('jwt')
  public async upsertJobSpecificDocument(
    @Request() req: any,
    @Path() applicationId: number,
    @Path() jobSpecificDocumentId: number,
    @Body() body: { file_path: string }
  ): Promise<{ updated: true }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);

    const file_path = String(body?.file_path ?? '').trim();
    if (!file_path) throw httpError(400, 'file_path is required');

    await callProc(
      `CALL sp_rec_application_job_documents('UPSERT', NULL, :application_id, :job_specific_document_id, :file_path)`,
      {
        application_id: applicationId,
        job_specific_document_id: jobSpecificDocumentId,
        file_path
      }
    );

    return { updated: true };
  }
}
