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

type EmploymentType = {
  employment_type_id: number;
  type_name: string;
  description: string | null;
  status: 0 | 1;
  created_at: string;
};

type WorkMode = {
  work_mode_id: number;
  mode_name: string;
  description: string | null;
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

  @Get('employment-types')
  @Security('jwt')
  public async listEmploymentTypes(@Query() include_inactive?: boolean): Promise<EmploymentType[]> {
    return callProc<RowDataPacket & EmploymentType>(
      `CALL sp_job_employment_types('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('employment-types')
  @Security('jwt')
  public async createEmploymentType(
    @Body() body: { type_name: string; description?: string | null; status?: boolean }
  ): Promise<{ employment_type_id: number }> {
    const rows = await callProc<RowDataPacket & { employment_type_id: number }>(
      `CALL sp_job_employment_types('CREATE', NULL, :type_name, :description, :status, NULL)`,
      { type_name: body.type_name, description: body.description ?? null, status: body.status ?? true }
    );
    const employment_type_id = rows[0]?.employment_type_id;
    if (!employment_type_id) throw httpError(500, 'Failed to create employment type');
    return { employment_type_id };
  }

  @Put('employment-types/{id}')
  @Security('jwt')
  public async updateEmploymentType(
    @Path() id: number,
    @Body() body: Partial<{ type_name: string; description: string | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_employment_types('UPDATE', :id, :type_name, :description, :status, NULL)`,
      {
        id,
        type_name: body.type_name ?? null,
        description: body.description ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Employment type not found');
    return { updated: true };
  }

  @Delete('employment-types/{id}')
  @Security('jwt')
  public async disableEmploymentType(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_employment_types('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Employment type not found');
    return { disabled: true };
  }

  @Get('work-modes')
  @Security('jwt')
  public async listWorkModes(@Query() include_inactive?: boolean): Promise<WorkMode[]> {
    return callProc<RowDataPacket & WorkMode>(
      `CALL sp_job_work_modes('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('work-modes')
  @Security('jwt')
  public async createWorkMode(
    @Body() body: { mode_name: string; description?: string | null; status?: boolean }
  ): Promise<{ work_mode_id: number }> {
    const rows = await callProc<RowDataPacket & { work_mode_id: number }>(
      `CALL sp_job_work_modes('CREATE', NULL, :mode_name, :description, :status, NULL)`,
      { mode_name: body.mode_name, description: body.description ?? null, status: body.status ?? true }
    );
    const work_mode_id = rows[0]?.work_mode_id;
    if (!work_mode_id) throw httpError(500, 'Failed to create work mode');
    return { work_mode_id };
  }

  @Put('work-modes/{id}')
  @Security('jwt')
  public async updateWorkMode(
    @Path() id: number,
    @Body() body: Partial<{ mode_name: string; description: string | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_work_modes('UPDATE', :id, :mode_name, :description, :status, NULL)`,
      {
        id,
        mode_name: body.mode_name ?? null,
        description: body.description ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Work mode not found');
    return { updated: true };
  }

  @Delete('work-modes/{id}')
  @Security('jwt')
  public async disableWorkMode(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_job_work_modes('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Work mode not found');
    return { disabled: true };
  }
}
