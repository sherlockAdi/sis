import { Body, Controller, Delete, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

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
  created_by: number | null;
  created_at: string;
};

type JobRequirement = { requirement_id: number; job_id: number; location_id: number | null; requirement: string };
type JobBenefit = { benefit_id: number; job_id: number; location_id: number | null; benefit: string };
type JobDocument = { id: number; job_id: number; document_type_id: number; document_name: string; is_required: 0 | 1 };
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

  requirements?: string[];
  benefits?: string[];
  documents?: Array<{ document_type_id: number; is_required?: boolean }>;
  locations?: Array<{
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    vacancy?: number | null;
    salary_min?: number | null;
    salary_max?: number | null;
    requirements?: string[];
    benefits?: string[];
  }>;
};

@Route('jobs')
@Tags('Jobs')
export class JobsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<JobRow[]> {
    return callProc<RowDataPacket & JobRow>(
      `CALL sp_job_jobs('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
    );
  }

  @Get('{jobId}')
  @Security('jwt')
  public async get(@Path() jobId: number): Promise<{
    job: JobRow;
    requirements: JobRequirement[];
    benefits: JobBenefit[];
    documents: JobDocument[];
    locations: JobLocation[];
    status_history: JobStatusHistory[];
  }> {
    const jobRows = await callProc<RowDataPacket & JobRow>(
      `CALL sp_job_jobs('GET', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { job_id: jobId }
    );
    const job = jobRows[0];
    if (!job) throw httpError(404, 'Job not found');

    const [requirements, benefits, documents, locations, status_history] = await Promise.all([
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
      callProc<RowDataPacket & JobLocation>(
        `CALL sp_job_locations('LIST_BY_JOB', NULL, :job_id, NULL, NULL, NULL, NULL, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & JobStatusHistory>(
        `CALL sp_job_status_history('LIST_BY_JOB', NULL, :job_id, NULL, NULL, NULL)`,
        { job_id: jobId }
      ),
    ]);

    return { job, requirements, benefits, documents, locations, status_history };
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: JobUpsertBody, @Request() req: any): Promise<{ job_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    if (!body.job_title?.trim()) throw httpError(400, 'job_title is required');

    const rows = await callProc<RowDataPacket & { job_id: number }>(
      `CALL sp_job_jobs('CREATE', NULL, :job_code, :job_title, :category_id, :country_id, :contract_duration_id, :vacancy, :salary_min, :salary_max, :job_description, :status, :created_by, NULL)`,
      {
        job_code: body.job_code ?? null,
        job_title: body.job_title,
        category_id: body.category_id ?? null,
        // keep backward-compat, but primary country is derived from locations
        country_id: body.country_id ?? null,
        contract_duration_id: body.contract_duration_id ?? null,
        vacancy: null,
        salary_min: null,
        salary_max: null,
        job_description: body.job_description ?? null,
        status: body.status ?? null,
        created_by: user.user_id,
      }
    );

    const job_id = rows[0]?.job_id;
    if (!job_id) throw httpError(500, 'Failed to create job');

    const documents = (body.documents ?? []).filter((d) => typeof d?.document_type_id === 'number');
    const globalRequirements = (body.requirements ?? []).map((s) => String(s).trim()).filter(Boolean);
    const globalBenefits = (body.benefits ?? []).map((s) => String(s).trim()).filter(Boolean);
    const locations = (body.locations ?? []).filter((l) => l && (l.country_id || l.state_id || l.city_id));
    for (const d of documents) {
      await callProc(`CALL sp_job_documents('CREATE', NULL, :job_id, :document_type_id, :is_required)`, {
        job_id,
        document_type_id: d.document_type_id,
        is_required: d.is_required ?? true
      });
    }

    if (locations.length === 0) {
      for (const r of globalRequirements) {
        await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, NULL, :requirement)`, { job_id, requirement: r });
      }
      for (const b of globalBenefits) {
        await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, NULL, :benefit)`, { job_id, benefit: b });
      }
      return { job_id };
    }

    for (const l of locations) {
      const locRows = await callProc<RowDataPacket & { id: number }>(
        `CALL sp_job_locations('CREATE', NULL, :job_id, :country_id, :state_id, :city_id, :vacancy, :salary_min, :salary_max)`,
        {
          job_id,
          country_id: l.country_id ?? null,
          state_id: l.state_id ?? null,
          city_id: l.city_id ?? null,
          vacancy: l.vacancy ?? null,
          salary_min: typeof l.salary_min === 'number' ? l.salary_min : null,
          salary_max: typeof l.salary_max === 'number' ? l.salary_max : null
        }
      );
      const location_id = locRows[0]?.id;
      if (!location_id) throw httpError(500, 'Failed to create job location');

      const reqs = (l.requirements ?? globalRequirements).map((s) => String(s).trim()).filter(Boolean);
      const bens = (l.benefits ?? globalBenefits).map((s) => String(s).trim()).filter(Boolean);

      for (const r of reqs) {
        await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, :location_id, :requirement)`, {
          job_id,
          location_id,
          requirement: r
        });
      }
      for (const b of bens) {
        await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, :location_id, :benefit)`, {
          job_id,
          location_id,
          benefit: b
        });
      }
    }

    return { job_id };
  }

  @Put('{jobId}')
  @Security('jwt')
  public async update(@Path() jobId: number, @Body() body: Partial<JobUpsertBody>): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_jobs('UPDATE', :job_id, :job_code, :job_title, :category_id, :country_id, :contract_duration_id, :vacancy, :salary_min, :salary_max, :job_description, :status, NULL, NULL)`,
      {
        job_id: jobId,
        job_code: body.job_code ?? null,
        job_title: body.job_title ?? null,
        category_id: typeof body.category_id === 'number' ? body.category_id : null,
        // keep backward-compat, but primary country is derived from locations
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        contract_duration_id: typeof body.contract_duration_id === 'number' ? body.contract_duration_id : null,
        vacancy: null,
        salary_min: null,
        salary_max: null,
        job_description: body.job_description ?? null,
        status: body.status ?? null,
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Job not found');

    if (Array.isArray(body.locations)) {
      const globalRequirements = (body.requirements ?? []).map((s) => String(s).trim()).filter(Boolean);
      const globalBenefits = (body.benefits ?? []).map((s) => String(s).trim()).filter(Boolean);

      await callProc(`CALL sp_job_requirements('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
      await callProc(`CALL sp_job_benefits('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
      await callProc(`CALL sp_job_locations('DELETE_BY_JOB', NULL, :job_id, NULL, NULL, NULL, NULL, NULL, NULL)`, { job_id: jobId });

      const locs = body.locations.filter((l) => l && (l.country_id || l.state_id || l.city_id));
      for (const l of locs) {
        const locRows = await callProc<RowDataPacket & { id: number }>(
          `CALL sp_job_locations('CREATE', NULL, :job_id, :country_id, :state_id, :city_id, :vacancy, :salary_min, :salary_max)`,
          {
            job_id: jobId,
            country_id: l.country_id ?? null,
            state_id: l.state_id ?? null,
            city_id: l.city_id ?? null,
            vacancy: l.vacancy ?? null,
            salary_min: typeof l.salary_min === 'number' ? l.salary_min : null,
            salary_max: typeof l.salary_max === 'number' ? l.salary_max : null
          }
        );
        const location_id = locRows[0]?.id;
        if (!location_id) throw httpError(500, 'Failed to create job location');

        const reqs = (l.requirements ?? globalRequirements).map((s) => String(s).trim()).filter(Boolean);
        const bens = (l.benefits ?? globalBenefits).map((s) => String(s).trim()).filter(Boolean);

        for (const r of reqs) {
          await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, :location_id, :requirement)`, {
            job_id: jobId,
            location_id,
            requirement: r
          });
        }
        for (const b of bens) {
          await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, :location_id, :benefit)`, {
            job_id: jobId,
            location_id,
            benefit: b
          });
        }
      }
    } else {
      // Backwards-compatible: requirements/benefits stored globally when locations aren't supplied.
      if (Array.isArray(body.requirements)) {
        await callProc(`CALL sp_job_requirements('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
        const requirements = body.requirements.map((s) => String(s).trim()).filter(Boolean);
        for (const r of requirements) {
          await callProc(`CALL sp_job_requirements('CREATE', NULL, :job_id, NULL, :requirement)`, { job_id: jobId, requirement: r });
        }
      }

      if (Array.isArray(body.benefits)) {
        await callProc(`CALL sp_job_benefits('DELETE_BY_JOB', NULL, :job_id, NULL, NULL)`, { job_id: jobId });
        const benefits = body.benefits.map((s) => String(s).trim()).filter(Boolean);
        for (const b of benefits) {
          await callProc(`CALL sp_job_benefits('CREATE', NULL, :job_id, NULL, :benefit)`, { job_id: jobId, benefit: b });
        }
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
    if (!body?.status?.trim()) throw httpError(400, 'status is required');

    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_jobs('SET_STATUS', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :status, :changed_by, :remarks)`,
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
  public async remove(@Path() jobId: number): Promise<{ deleted: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_jobs('DELETE', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { job_id: jobId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Job not found');
    return { deleted: true };
  }
}
