import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type Permission = {
  permission_id: number;
  role_id: number;
  menu_id: number;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
};

type PermissionCreate = {
  role_id: number;
  menu_id: number;
  can_view?: boolean;
  can_add?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
};

type PermissionUpdate = Partial<Omit<PermissionCreate, 'role_id' | 'menu_id'>>;

@Route('permissions')
@Tags('Permissions')
export class PermissionsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() role_id?: number, @Query() menu_id?: number): Promise<Permission[]> {
    const rows = await callProc<RowDataPacket & Permission>(`CALL sp_permissions_list(:role_id, :menu_id)`, {
      role_id: role_id ?? null,
      menu_id: menu_id ?? null
    });
    return rows;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: PermissionCreate): Promise<{ permission_id: number }> {
    try {
      const rows = await callProc<RowDataPacket & { permission_id: number }>(
        `CALL sp_permissions_create(:role_id, :menu_id, :can_view, :can_add, :can_edit, :can_delete)`,
        {
          role_id: body.role_id,
          menu_id: body.menu_id,
          can_view: body.can_view ?? true,
          can_add: body.can_add ?? false,
          can_edit: body.can_edit ?? false,
          can_delete: body.can_delete ?? false
        }
      );
      const permission_id = rows[0]?.permission_id;
      if (!permission_id) throw httpError(500, 'Failed to create permission');
      return { permission_id };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'Permission already exists for this role/menu');
      throw e;
    }
  }

  @Put('{permissionId}')
  @Security('jwt')
  public async update(@Path() permissionId: number, @Body() body: PermissionUpdate): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_permissions_update(:permissionId, :can_view, :can_add, :can_edit, :can_delete)`,
      {
        permissionId,
        can_view: typeof body.can_view === 'boolean' ? body.can_view : null,
        can_add: typeof body.can_add === 'boolean' ? body.can_add : null,
        can_edit: typeof body.can_edit === 'boolean' ? body.can_edit : null,
        can_delete: typeof body.can_delete === 'boolean' ? body.can_delete : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Permission not found');
    return { updated: true };
  }

  @Delete('{permissionId}')
  @Security('jwt')
  public async remove(@Path() permissionId: number): Promise<{ deleted: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_permissions_delete(:permissionId)`,
      { permissionId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Permission not found');
    return { deleted: true };
  }
}
