import { Controller, Get, Path, Query, Route, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type PublicJobPreviewRow = {
  job_id: number;
  job_code: string | null;
  job_title: string;
  category_id: number | null;
  category_name: string | null;
  country_id: number | null;
  country_name: string | null;
  contract_duration_id: number | null;
  duration_name: string | null;
  months: number | null;
  vacancy: number;
  salary_min: string | null;
  salary_max: string | null;
  status: string | null;
  created_by: number | null;
  created_at: string;
};

type PublicJobRow = {
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

type PublicJobRequirement = { requirement_id: number; job_id: number; location_id: number | null; requirement: string };
type PublicJobBenefit = { benefit_id: number; job_id: number; location_id: number | null; benefit: string };
type PublicJobDocument = { id: number; job_id: number; document_type_id: number; document_name: string; is_required: 0 | 1 };
type PublicJobLocation = {
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

@Route('public/jobs')
@Tags('Public')
export class PublicJobsController extends Controller {
  @Get('preview')
  public async preview(
    @Query() country_id?: number,
    @Query() state_id?: number,
    @Query() city_id?: number,
    @Query() category_id?: number,
    @Query() status?: string
  ): Promise<PublicJobPreviewRow[]> {
    const raw = String(status ?? '').trim();
    // Portal uses statuses like "Open / On Hold / Closed". Some older UIs send "Active".
    const desiredStatus = raw ? (raw.toLowerCase() === 'active' ? 'Open' : raw) : 'Open';

    const rows = await callProc<RowDataPacket & PublicJobPreviewRow>(
      `CALL sp_job_jobs_search(:country_id, :state_id, :city_id, :category_id, :status)`,
      {
        country_id: typeof country_id === 'number' ? country_id : null,
        state_id: typeof state_id === 'number' ? state_id : null,
        city_id: typeof city_id === 'number' ? city_id : null,
        category_id: typeof category_id === 'number' ? category_id : null,
        // Fetch without status so we can do safe, trimmed matching in Node.
        status: null
      }
    );

    // Never show closed jobs on the public site.
    const openish = rows.filter((r) => String(r.status ?? '').trim().toLowerCase() !== 'closed');

    // Apply a tolerant status filter if requested/defaulted.
    const want = String(desiredStatus ?? '').trim().toLowerCase();
    if (!want) return openish;
    return openish.filter((r) => String(r.status ?? '').trim().toLowerCase() === want);
  }

  @Get('{jobId}')
  public async get(@Path() jobId: number): Promise<{
    job: PublicJobRow;
    requirements: PublicJobRequirement[];
    benefits: PublicJobBenefit[];
    documents: PublicJobDocument[];
    locations: PublicJobLocation[];
  }> {
    const jobRows = await callProc<RowDataPacket & PublicJobRow>(
      `CALL sp_job_jobs('GET', :job_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { job_id: jobId }
    );
    const job = jobRows[0];
    if (!job) throw httpError(404, 'Job not found');
    // Don't expose closed jobs publicly (avoid stale links).
    if (String(job.status ?? '').trim().toLowerCase() === 'closed') throw httpError(404, 'Job not found');

    const [requirements, benefits, documents, locations] = await Promise.all([
      callProc<RowDataPacket & PublicJobRequirement>(
        `CALL sp_job_requirements('LIST_BY_JOB', NULL, :job_id, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & PublicJobBenefit>(
        `CALL sp_job_benefits('LIST_BY_JOB', NULL, :job_id, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & PublicJobDocument>(
        `CALL sp_job_documents('LIST_BY_JOB', NULL, :job_id, NULL, NULL)`,
        { job_id: jobId }
      ),
      callProc<RowDataPacket & PublicJobLocation>(
        `CALL sp_job_locations('LIST_BY_JOB', NULL, :job_id, NULL, NULL, NULL, NULL, NULL, NULL)`,
        { job_id: jobId }
      )
    ]);

    return { job, requirements, benefits, documents, locations };
  }
}
