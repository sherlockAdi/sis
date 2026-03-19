import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type JobCategory = {
  category_id: number;
  category_name: string;
  description: string | null;
  status: 0 | 1;
  created_at: string;
};

type ContractDuration = {
  duration_id: number;
  duration_name: string | null;
  months: number | null;
  status: 0 | 1;
  created_at: string;
};

@Route('masters/job')
@Tags('Masters')
export class MastersJobController extends Controller {
  @Get('categories')
  @Security('jwt')
  public async listCategories(@Query() include_inactive?: boolean): Promise<JobCategory[]> {
    return callProc<RowDataPacket & JobCategory>(
      `CALL sp_job_categories('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('categories')
  @Security('jwt')
  public async createCategory(
    @Body() body: { category_name: string; description?: string | null; status?: boolean }
  ): Promise<{ category_id: number }> {
    const rows = await callProc<RowDataPacket & { category_id: number }>(
      `CALL sp_job_categories('CREATE', NULL, :category_name, :description, :status, NULL)`,
      {
        category_name: body.category_name,
        description: body.description ?? null,
        status: body.status ?? true
      }
    );
    const category_id = rows[0]?.category_id;
    if (!category_id) throw httpError(500, 'Failed to create category');
    return { category_id };
  }

  @Put('categories/{id}')
  @Security('jwt')
  public async updateCategory(
    @Path() id: number,
    @Body() body: Partial<{ category_name: string; description: string | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_categories('UPDATE', :id, :category_name, :description, :status, NULL)`,
      {
        id,
        category_name: body.category_name ?? null,
        description: body.description ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Category not found');
    return { updated: true };
  }

  @Delete('categories/{id}')
  @Security('jwt')
  public async disableCategory(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_categories('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Category not found');
    return { disabled: true };
  }

  @Get('contract-durations')
  @Security('jwt')
  public async listContractDurations(@Query() include_inactive?: boolean): Promise<ContractDuration[]> {
    return callProc<RowDataPacket & ContractDuration>(
      `CALL sp_job_contract_durations('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('contract-durations')
  @Security('jwt')
  public async createContractDuration(
    @Body() body: { duration_name?: string | null; months?: number | null; status?: boolean }
  ): Promise<{ duration_id: number }> {
    const rows = await callProc<RowDataPacket & { duration_id: number }>(
      `CALL sp_job_contract_durations('CREATE', NULL, :duration_name, :months, :status, NULL)`,
      {
        duration_name: body.duration_name ?? null,
        months: body.months ?? null,
        status: body.status ?? true
      }
    );
    const duration_id = rows[0]?.duration_id;
    if (!duration_id) throw httpError(500, 'Failed to create contract duration');
    return { duration_id };
  }

  @Put('contract-durations/{id}')
  @Security('jwt')
  public async updateContractDuration(
    @Path() id: number,
    @Body() body: Partial<{ duration_name: string | null; months: number | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_contract_durations('UPDATE', :id, :duration_name, :months, :status, NULL)`,
      {
        id,
        duration_name: body.duration_name ?? null,
        months: body.months ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Contract duration not found');
    return { updated: true };
  }

  @Delete('contract-durations/{id}')
  @Security('jwt')
  public async disableContractDuration(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_contract_durations('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Contract duration not found');
    return { disabled: true };
  }
}
