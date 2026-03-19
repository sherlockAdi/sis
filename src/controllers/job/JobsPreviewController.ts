import { Controller, Get, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';

type JobPreviewRow = {
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

@Route('jobs-preview')
@Tags('Jobs')
export class JobsPreviewController extends Controller {
  @Get()
  @Security('jwt')
  public async list(
    @Query() country_id?: number,
    @Query() state_id?: number,
    @Query() city_id?: number,
    @Query() category_id?: number,
    @Query() status?: string
  ): Promise<JobPreviewRow[]> {
    return callProc<RowDataPacket & JobPreviewRow>(
      `CALL sp_job_jobs_search(:country_id, :state_id, :city_id, :category_id, :status)`,
      {
        country_id: typeof country_id === 'number' ? country_id : null,
        state_id: typeof state_id === 'number' ? state_id : null,
        city_id: typeof city_id === 'number' ? city_id : null,
        category_id: typeof category_id === 'number' ? category_id : null,
        status: status ?? null
      }
    );
  }
}

