import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type MenuFeedRow = {
  menu_id: number;
  menu_name: string;
  menu_code: string | null;
  parent_menu_id: number | null;
  menu_path: string | null;
  icon: string | null;
  menu_order: number;
  status: 0 | 1;
  can_view: 0 | 1;
  can_add: 0 | 1;
  can_edit: 0 | 1;
  can_delete: 0 | 1;
};

@Route('menu')
@Tags('Menu')
export class MenuFeedController extends Controller {
  @Get('feed')
  @Security('jwt')
  public async feed(@Request() req: any): Promise<MenuFeedRow[]> {
    const user = (req as any).user as { role_id?: number } | undefined;
    if (!user?.role_id) throw httpError(401, 'Unauthorized');

    return callProc<RowDataPacket & MenuFeedRow>(`CALL sp_menu_feed(:role_id)`, { role_id: user.role_id });
  }
}
