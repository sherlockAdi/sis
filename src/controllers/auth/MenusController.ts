import { Body, Controller, Delete, Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type Menu = {
  menu_id: number;
  menu_name: string;
  menu_code: string | null;
  parent_menu_id: number | null;
  menu_path: string | null;
  icon: string | null;
  menu_order: number;
  status: boolean;
  created_at: string;
};

type MenuCreate = {
  menu_name: string;
  menu_code?: string | null;
  parent_menu_id?: number | null;
  menu_path?: string | null;
  icon?: string | null;
  menu_order?: number;
  status?: boolean;
};

type MenuUpdate = Partial<MenuCreate>;

@Route('menus')
@Tags('Menus')
export class MenusController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<Menu[]> {
    const rows = await callProc<RowDataPacket & Menu>(`CALL sp_menus_list()`);
    return rows;
  }

  @Get('{menuId}')
  @Security('jwt')
  public async get(@Path() menuId: number): Promise<Menu> {
    const rows = await callProc<RowDataPacket & Menu>(`CALL sp_menus_get(:menuId)`, { menuId });
    const menu = rows[0];
    if (!menu) throw httpError(404, 'Menu not found');
    return menu;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: MenuCreate): Promise<{ menu_id: number }> {
    const rows = await callProc<RowDataPacket & { menu_id: number }>(
      `CALL sp_menus_create(:menu_name, :menu_code, :parent_menu_id, :menu_path, :icon, :menu_order, :status)`,
      {
        menu_name: body.menu_name,
        menu_code: body.menu_code ?? null,
        parent_menu_id: body.parent_menu_id ?? null,
        menu_path: body.menu_path ?? null,
        icon: body.icon ?? null,
        menu_order: body.menu_order ?? 0,
        status: body.status ?? true
      }
    );
    const menu_id = rows[0]?.menu_id;
    if (!menu_id) throw httpError(500, 'Failed to create menu');
    return { menu_id };
  }

  @Put('{menuId}')
  @Security('jwt')
  public async update(@Path() menuId: number, @Body() body: MenuUpdate): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_menus_update(:menuId, :menu_name, :menu_code, :parent_menu_id, :menu_path, :icon, :menu_order, :status)`,
      {
        menuId,
        menu_name: body.menu_name ?? null,
        menu_code: body.menu_code ?? null,
        parent_menu_id: typeof body.parent_menu_id === 'number' ? body.parent_menu_id : null,
        menu_path: body.menu_path ?? null,
        icon: body.icon ?? null,
        menu_order: typeof body.menu_order === 'number' ? body.menu_order : null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Menu not found');
    return { updated: true };
  }

  @Delete('{menuId}')
  @Security('jwt')
  public async disable(@Path() menuId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(`CALL sp_menus_disable(:menuId)`, { menuId });
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Menu not found');
    return { disabled: true };
  }
}
