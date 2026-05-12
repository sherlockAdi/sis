import { Body, Controller, Delete, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { getPartnerByUserId, getRoleCodeForUserId } from '../../services/partnerService';
import { decodeBase64Text, encodeBase64Text } from '../../utils/base64Text';

type JobRow = {
  job_id: number;
  job_code: string | null;
  job_title: string;
  category_id: number | null;
  category_name?: string | null;
  country_id: number | null;
  country_name?: string | null;
  contract_duration_id: number | null;
  duration_name?: string | null;
  months?: number | null;
  vacancy: number | null;
  salary_min: string | null;
  salary_max: string | null;
  job_description?: string | null;
  status: string | null;
  partner_id?: number | null;
  partner_name?: string | null;
  employment_type_id?: number | null;
  employment_type_name?: string | null;
  work_mode_id?: number | null;
  work_mode_name?: string | null;
  currency_id?: number | null;
  currency_code?: string | null;
  currency_name?: string | null;
  symbol?: string | null;
  compensation_text?: string | null;
  min_education?: string | null;
  skills?: string | null;
  min_experience?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  gender_requirement?: string | null;
  created_by: number | null;
  created_at: string;
};

type JobRequirement = { requirement_id: number; job_id: number; location_id: number | null; requirement: string };
type JobBenefit = { benefit_id: number; job_id: number; location_id: number | null; benefit: string };
type JobDocument = { id: number; job_id: number; document_type_id: number; document_name: string; is_required: 0 | 1 };
type JobSpecificDocument = {
  id: number;
  job_id: number;
  document_name: string;
  is_required: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
type JobLocation = {
  id: number;
  job_id: number;
  country_id: number | null;
  country_name: string | null;
  state_id: number | null;
  state_name: string | null;
  city_id: number | null;
  city_name: string | null;
  vacancy: number | null;
  salary_min: string | null;
  salary_max: string | null;
};
type JobStatusHistory = {
  id: number;
  job_id: number;
  status: string | null;
  remarks: string | null;
  changed_by: number | null;
  changed_at: string;
};
type JobLanguage = { id: number; job_id: number; language_id: number; language_name: string };

type JobUpsertBody = {
  job_code?: string | null;
  job_title: string;
  category_id?: number | null;
  country_id?: number | null;
  contract_duration_id?: number | null;
  vacancy?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  job_description?: string | null;
  status?: string | null;
  partner_id?: number | null;
  employment_type_id?: number | null;
  work_mode_id?: number | null;
  currency_id?: number | null;
  compensation_text?: string | null;
  min_education?: string | null;
  skills?: string | null;
  min_experience?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  gender_requirement?: string | null;
  language_ids?: number[];

  requirements?: string[];
  benefits?: string[];
  documents?: Array<{ document_type_id: number; is_required?: boolean }>;
  job_specific_documents?: Array<{ id?: number; document_name: string; is_required?: boolean }>;
  location?: {
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
  };
};

async function getPartnerContext(user_id: number): Promise<{ partner_id: number | null; is_partner_role: boolean }> {
  const partner = await getPartnerByUserId(user_id);
  const roleCode = String(await getRoleCodeForUserId(user_id)).toUpperCase();
  const is_partner_role = roleCode === 'SOURCING' || roleCode === 'PARTNER';
  return { partner_id: partner?.partner_id ?? null, is_partner_role };
}

async function assertJobOwnedByPartner(job_id: number, partner_id: number): Promise<void> {
  const rows = await callProc<RowDataPacket & JobRow>(
    `CALL sp_job_jobs('GET', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
    { job_id }
  );
  const job = rows[0];
  if (!job) throw httpError(404, 'Job not found');
  if (Number(job.partner_id ?? 0) !== Number(partner_id)) throw httpError(403, 'Forbidden');
}

async function getJobById(job_id: number): Promise<JobRow> {
  const rows = await callProc<RowDataPacket & JobRow>(
    `CALL sp_job_jobs('GET', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
    { job_id }
  );
  const job = rows[0];
  if (!job) throw httpError(404, 'Job not found');
  return job;
}

function decodeJobTextFields(job: JobRow): JobRow {
  return {
    ...job,
    job_description: decodeBase64Text(job.job_description),
    compensation_text: decodeBase64Text(job.compensation_text),
  };
}

@Route('jobs')
@Tags('Jobs')
export class JobsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<JobRow[]> {
    const user = (req as any).user as { user_id?: number } | undefined;
    const ctx = user?.user_id ? await getPartnerContext(user.user_id) : { partner_id: null, is_partner_role: false };
    if (ctx.is_partner_role && !ctx.partner_id) throw httpError(403, 'Partner profile not found');
    if (ctx.partner_id) {
      return callProc<RowDataPacket & JobRow>(
        `CALL sp_job_jobs('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
        { partner_id: ctx.partner_id }
      );
    }
    return callProc<RowDataPacket & JobRow>(
      `CALL sp_job_jobs('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
    );
  }

  @Get('{jobId}')
  @Security('jwt')
  public async get(@Path() jobId: number, @Request() req: any): Promise<{
    job: JobRow;
    requirements: JobRequirement[];
    benefits: JobBenefit[];
    documents: JobDocument[];
    job_specific_documents: JobSpecificDocument[];
    locations: JobLocation[];
    status_history: JobStatusHistory[];
    languages: JobLanguage[];
  }> {
    const jobRows = await callProc<RowDataPacket & JobRow>(
      `CALL sp_job_jobs('GET', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { job_id: jobId }
    );
    const job = jobRows[0];
    if (!job) throw httpError(404, 'Job not found');
    const user = (req as any).user as { user_id?: number } | undefined;
    if (user?.user_id) {
      const ctx = await getPartnerContext(user.user_id);
      if (ctx.is_partner_role && !ctx.partner_id) throw httpError(403, 'Partner profile not found');
      if (ctx.partner_id && Number(job.partner_id ?? 0) !== Number(ctx.partner_id)) {
        throw httpError(403, 'Forbidden');
      }
    }

    const [requirements, benefits, documents, job_specific_documents, locations, status_history, languages] = await Promise.all([
      callProc<RowDataPacket & JobRequirement>(
        `CALL sp_job_requirements('LIST_BY_JOB', NULL, :job_id, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & JobBenefit>(
        `CALL sp_job_benefits('LIST_BY_JOB', NULL, :job_id, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & JobDocument>(
        `CALL sp_job_documents('LIST_BY_JOB', NULL, :job_id, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & JobSpecificDocument>(
        `CALL sp_job_specific_documents('LIST_BY_JOB', NULL, :job_id, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & JobLocation>(
        `CALL sp_job_locations('LIST_BY_JOB', NULL, :job_id, NULL, NULL, NULL, NULL, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & JobStatusHistory>(
        `CALL sp_job_status_history('LIST_BY_JOB', NULL, :job_id, NULL, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & JobLanguage>(
        `CALL sp_job_languages('LIST_BY_JOB', NULL, :job_id, NULL)`,
        { job_id: jobId }
      ),
    ]);

    return { job: decodeJobTextFields(job), requirements, benefits, documents, job_specific_documents, locations, status_history, languages };
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: JobUpsertBody, @Request() req: any): Promise<{ job_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    if (!body.job_title?.trim()) throw httpError(400, 'job_title is required');

    const ctx = await getPartnerContext(user.user_id);
    if (ctx.is_partner_role && !ctx.partner_id) throw httpError(403, 'Partner profile not found');
    const resolvedPartnerId = ctx.partner_id ?? (typeof body.partner_id === 'number' ? body.partner_id : null);
    const resolvedStatus = ctx.partner_id ? 'Draft' : (body.status ?? null);

    const rows = await callProc<RowDataPacket & { job_id: number }>(
      `CALL sp_job_jobs('CREATE', NULL, :job_code, :job_title, :category_id, :country_id, :contract_duration_id, :vacancy, :salary_min, :salary_max, :job_description, :status, :partner_id, :employment_type_id, :work_mode_id, :currency_id, :compensation_text, :min_education, :skills, :min_experience, :min_age, :max_age, :gender_requirement, :created_by, NULL)`,
      {
        job_code: null,
        job_title: body.job_title,
        category_id: body.category_id ?? null,
        country_id: body.country_id ?? null,
        contract_duration_id: body.contract_duration_id ?? null,
        vacancy: typeof body.vacancy === 'number' ? body.vacancy : null,
        salary_min: typeof body.salary_min === 'number' ? body.salary_min : null,
        salary_max: typeof body.salary_max === 'number' ? body.salary_max : null,
        job_description: encodeBase64Text(body.job_description),
        status: resolvedStatus,
        partner_id: resolvedPartnerId,
        employment_type_id: typeof body.employment_type_id === 'number' ? body.employment_type_id : null,
        work_mode_id: typeof body.work_mode_id === 'number' ? body.work_mode_id : null,
        currency_id: typeof body.currency_id === 'number' ? body.currency_id : null,
        compensation_text: encodeBase64Text(body.compensation_text),
        min_education: body.min_education ?? null,
        skills: body.skills ?? null,
        min_experience: body.min_experience ?? null,
        min_age: typeof body.min_age === 'number' ? body.min_age : null,
        max_age: typeof body.max_age === 'number' ? body.max_age : null,
        gender_requirement: body.gender_requirement ?? null,
        created_by: user.user_id,
      }
    );

    const job_id = rows[0]?.job_id;
    if (!job_id) throw httpError(500, 'Failed to create job');

    const documents = (body.documents ?? []).filter((d) => typeof d?.document_type_id === 'number');
    const globalRequirements = (body.requirements ?? []).map((s) => String(s).trim()).filter(Boolean);
    const globalBenefits = (body.benefits ?? []).map((s) => String(s).trim()).filter(Boolean);
    for (const d of documents) {
      await callProc(`CALL sp_job_documents('CREATE', NULL, :job_id, :document_type_id, :is_required)`, {
        job_id,
        document_type_id: d.document_type_id,
        is_required: d.is_required ?? true
      });
    }
    const jobSpecificDocuments = (body.job_specific_documents ?? [])
      .map((d) => ({ id: typeof d?.id === 'number' ? d.id : null, document_name: String(d?.document_name ?? '').trim(), is_required: d.is_required ?? true }))
      .filter((d) => Boolean(d.document_name));
    for (const d of jobSpecificDocuments) {
      await callProc(`CALL sp_job_specific_documents('CREATE', NULL, :job_id, :document_name, :is_required)`, {
        job_id,
        document_name: d.document_name,
        is_required: d.is_required
      });
    }

    const loc = body.location ?? null;
    if (loc && (loc.country_id || loc.state_id || loc.city_id)) {
      const locRows = await callProc<RowDataPacket & { id: number }>(
        `CALL sp_job_locations('CREATE', NULL, :job_id, :country_id, :state_id, :city_id, :vacancy, :salary_min, :salary_max)`,
        {
          job_id,
          country_id: loc.country_id ?? null,
          state_id: loc.state_id ?? null,
          city_id: loc.city_id ?? null,
          vacancy: typeof body.vacancy === 'number' ? body.vacancy : null,
          salary_min: typeof body.salary_min === 'number' ? body.salary_min : null,
          salary_max: typeof body.salary_max === 'number' ? body.salary_max : null
        }
      );
      const location_id = locRows[0]?.id;
      if (!location_id) throw httpError(500, 'Failed to create job location');

      for (const r of globalRequirements) {
        await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, :location_id, :requirement)`, {
          job_id,
          location_id,
          requirement: r
        });
      }
      for (const b of globalBenefits) {
        await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, :location_id, :benefit)`, {
          job_id,
          location_id,
          benefit: b
        });
      }
    } else {
      for (const r of globalRequirements) {
        await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, NULL, :requirement)`, { job_id, requirement: r });
      }
      for (const b of globalBenefits) {
        await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, NULL, :benefit)`, { job_id, benefit: b });
      }
    }

    const languageIds = (body.language_ids ?? []).filter((x) => typeof x === 'number') as number[];
    if (languageIds.length) {
      await callProc(`CALL sp_job_languages('DELETE_BY_JOB', NULL, :job_id, NULL)`, { job_id });
      for (const language_id of languageIds) {
        await callProc(`CALL sp_job_languages('CREATE', NULL, :job_id, :language_id)`, { job_id, language_id });
      }
    }

    return { job_id };
  }

  @Put('{jobId}')
  @Security('jwt')
  public async update(@Path() jobId: number, @Body() body: Partial<JobUpsertBody>, @Request() req: any): Promise<{ updated: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    const ctx = user?.user_id ? await getPartnerContext(user.user_id) : { partner_id: null, is_partner_role: false };
    if (ctx.is_partner_role && !ctx.partner_id) throw httpError(403, 'Partner profile not found');
    let existingJob: JobRow | null = null;
    if (ctx.partner_id) {
      existingJob = await getJobById(jobId);
      if (Number(existingJob.partner_id ?? 0) !== Number(ctx.partner_id)) throw httpError(403, 'Forbidden');
    }
    const resolvedStatus = ctx.partner_id ? (existingJob?.status ?? 'Draft') : (body.status ?? null);

    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_jobs('UPDATE', :job_id, :job_code, :job_title, :category_id, :country_id, :contract_duration_id, :vacancy, :salary_min, :salary_max, :job_description, :status, :partner_id, :employment_type_id, :work_mode_id, :currency_id, :compensation_text, :min_education, :skills, :min_experience, :min_age, :max_age, :gender_requirement, NULL, NULL)`,
      {
        job_id: jobId,
        job_code: body.job_code ?? null,
        job_title: body.job_title ?? null,
        category_id: typeof body.category_id === 'number' ? body.category_id : null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        contract_duration_id: typeof body.contract_duration_id === 'number' ? body.contract_duration_id : null,
        vacancy: typeof body.vacancy === 'number' ? body.vacancy : null,
        salary_min: typeof body.salary_min === 'number' ? body.salary_min : null,
        salary_max: typeof body.salary_max === 'number' ? body.salary_max : null,
        job_description: encodeBase64Text(body.job_description),
        status: resolvedStatus,
        partner_id: ctx.partner_id ?? (typeof body.partner_id === 'number' ? body.partner_id : null),
        employment_type_id: typeof body.employment_type_id === 'number' ? body.employment_type_id : null,
        work_mode_id: typeof body.work_mode_id === 'number' ? body.work_mode_id : null,
        currency_id: typeof body.currency_id === 'number' ? body.currency_id : null,
        compensation_text: encodeBase64Text(body.compensation_text),
        min_education: body.min_education ?? null,
        skills: body.skills ?? null,
        min_experience: body.min_experience ?? null,
        min_age: typeof body.min_age === 'number' ? body.min_age : null,
        max_age: typeof body.max_age === 'number' ? body.max_age : null,
        gender_requirement: body.gender_requirement ?? null,
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Job not found');

    const globalRequirements = (body.requirements ?? []).map((s) => String(s).trim()).filter(Boolean);
    const globalBenefits = (body.benefits ?? []).map((s) => String(s).trim()).filter(Boolean);
    const jobSpecificDocuments = Array.isArray(body.job_specific_documents)
      ? body.job_specific_documents
          .map((d) => ({ id: typeof d?.id === 'number' ? d.id : null, document_name: String(d?.document_name ?? '').trim(), is_required: d.is_required ?? true }))
          .filter((d) => Boolean(d.document_name))
      : null;

    await callProc(`CALL sp_job_requirements('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
    await callProc(`CALL sp_job_benefits('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
    await callProc(`CALL sp_job_locations('DELETE_BY_JOB', NULL, :job_id, NULL, NULL, NULL, NULL, NULL, NULL)`, { job_id: jobId });

    const loc = body.location ?? null;
    if (loc && (loc.country_id || loc.state_id || loc.city_id)) {
      const locRows = await callProc<RowDataPacket & { id: number }>(
        `CALL sp_job_locations('CREATE', NULL, :job_id, :country_id, :state_id, :city_id, :vacancy, :salary_min, :salary_max)`,
        {
          job_id: jobId,
          country_id: loc.country_id ?? null,
          state_id: loc.state_id ?? null,
          city_id: loc.city_id ?? null,
          vacancy: typeof body.vacancy === 'number' ? body.vacancy : null,
          salary_min: typeof body.salary_min === 'number' ? body.salary_min : null,
          salary_max: typeof body.salary_max === 'number' ? body.salary_max : null
        }
      );
      const location_id = locRows[0]?.id;
      if (!location_id) throw httpError(500, 'Failed to create job location');

      for (const r of globalRequirements) {
        await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, :location_id, :requirement)`, {
          job_id: jobId,
          location_id,
          requirement: r
        });
      }
      for (const b of globalBenefits) {
        await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, :location_id, :benefit)`, {
          job_id: jobId,
          location_id,
          benefit: b
        });
      }
    } else {
      for (const r of globalRequirements) {
        await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, NULL, :requirement)`, { job_id: jobId, requirement: r });
      }
      for (const b of globalBenefits) {
        await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, NULL, :benefit)`, { job_id: jobId, benefit: b });
      }
    }

    if (Array.isArray(body.documents)) {
      await callProc(`CALL sp_job_documents('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
      const docs = body.documents.filter((d) => typeof d?.document_type_id === 'number');
      for (const d of docs) {
        await callProc(`CALL sp_job_documents('CREATE', NULL, :job_id, :document_type_id, :is_required)`, {
          job_id: jobId,
          document_type_id: d.document_type_id,
          is_required: d.is_required ?? true
        });
      }
    }

    if (jobSpecificDocuments) {
      await callProc(`CALL sp_job_specific_documents('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
      for (const d of jobSpecificDocuments) {
        await callProc(`CALL sp_job_specific_documents('CREATE', NULL, :job_id, :document_name, :is_required)`, {
          job_id: jobId,
          document_name: d.document_name,
          is_required: d.is_required
        });
      }
    }

    if (Array.isArray(body.language_ids)) {
      await callProc(`CALL sp_job_languages('DELETE_BY_JOB', NULL, :job_id, NULL)`, { job_id: jobId });
      for (const language_id of body.language_ids.filter((x) => typeof x === 'number') as number[]) {
        await callProc(`CALL sp_job_languages('CREATE', NULL, :job_id, :language_id)`, { job_id: jobId, language_id });
      }
    }

    return { updated: true };
  }

  @Put('{jobId}/status')
  @Security('jwt')
  public async updateStatus(
    @Path() jobId: number,
    @Body() body: { status: string; remarks?: string | null },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    const ctx = await getPartnerContext(user.user_id);
    if (ctx.is_partner_role && !ctx.partner_id) throw httpError(403, 'Partner profile not found');
    if (ctx.partner_id) throw httpError(403, 'Forbidden');
    if (!body?.status?.trim()) throw httpError(400, 'status is required');

    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_jobs('SET_STATUS', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :status, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :changed_by, :remarks)`,
      {
        job_id: jobId,
        status: body.status,
        changed_by: user.user_id,
        remarks: body.remarks ?? null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Job not found');
    return { updated: true };
  }

  @Delete('{jobId}')
  @Security('jwt')
  public async remove(@Path() jobId: number, @Request() req: any): Promise<{ deleted: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (user?.user_id) {
      const ctx = await getPartnerContext(user.user_id);
      if (ctx.is_partner_role && !ctx.partner_id) throw httpError(403, 'Partner profile not found');
      if (ctx.partner_id) await assertJobOwnedByPartner(jobId, ctx.partner_id);
    }
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_jobs('DELETE', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { job_id: jobId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Job not found');
    return { deleted: true };
  }
}
