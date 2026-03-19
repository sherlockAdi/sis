import { Body, Controller, Delete, Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type Role = {
  role_id: number;
  role_name: string;
  role_code: string | null;
  description: string | null;
  status: boolean;
  created_at: string;
};

type RoleCreate = {
  role_name: string;
  role_code?: string | null;
  description?: string | null;
  status?: boolean;
};

type RoleUpdate = Partial<RoleCreate>;

@Route('roles')
@Tags('Roles')
export class RolesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<Role[]> {
    const rows = await callProc<RowDataPacket & Role>(`CALL sp_roles_list()`);
    return rows;
  }

  @Get('{roleId}')
  @Security('jwt')
  public async get(@Path() roleId: number): Promise<Role> {
    const rows = await callProc<RowDataPacket & Role>(`CALL sp_roles_get(:roleId)`, { roleId });
    const role = rows[0];
    if (!role) throw httpError(404, 'Role not found');
    return role;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: RoleCreate): Promise<{ role_id: number }> {
    const rows = await callProc<RowDataPacket & { role_id: number }>(
      `CALL sp_roles_create(:role_name, :role_code, :description, :status)`,
      {
        role_name: body.role_name,
        role_code: body.role_code ?? null,
        description: body.description ?? null,
        status: body.status ?? true
      }
    );
    const role_id = rows[0]?.role_id;
    if (!role_id) throw httpError(500, 'Failed to create role');
    return { role_id };
  }

  @Put('{roleId}')
  @Security('jwt')
  public async update(@Path() roleId: number, @Body() body: RoleUpdate): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_roles_update(:roleId, :role_name, :role_code, :description, :status)`,
      {
        roleId,
        role_name: body.role_name ?? null,
        role_code: body.role_code ?? null,
        description: body.description ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Role not found');
    return { updated: true };
  }

  @Delete('{roleId}')
  @Security('jwt')
  public async disable(@Path() roleId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(`CALL sp_roles_disable(:roleId)`, { roleId });
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Role not found');
    return { disabled: true };
  }
}
