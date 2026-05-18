import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type VisaChecklistMasterItem = {
  checklist_item_id: number;
  checklist_item_code: string;
  checklist_item_name: string;
  sort_order: number;
  is_required: 0 | 1;
  status: 0 | 1;
  created_at: string;
  updated_at: string;
};

@Route('masters/deployment')
@Tags('Masters')
export class MastersDeploymentController extends Controller {
  @Get('visa-checklists')
  @Security('jwt')
  public async listVisaChecklists(@Query() include_inactive?: boolean): Promise<VisaChecklistMasterItem[]> {
    return callProc<RowDataPacket & VisaChecklistMasterItem>(
      `CALL sp_dep_visa_checklist_master('LIST', NULL, NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('visa-checklists')
  @Security('jwt')
  public async createVisaChecklist(
    @Body()
    body: {
      checklist_item_code: string;
      checklist_item_name: string;
      sort_order?: number;
      is_required?: boolean;
      status?: boolean;
    }
  ): Promise<{ checklist_item_id: number }> {
    const rows = await callProc<RowDataPacket & { checklist_item_id: number }>(
      `CALL sp_dep_visa_checklist_master('CREATE', NULL, :checklist_item_code, :checklist_item_name, :sort_order, :is_required, :status, NULL)`,
      {
        checklist_item_code: String(body.checklist_item_code ?? '').trim(),
        checklist_item_name: String(body.checklist_item_name ?? '').trim(),
        sort_order: typeof body.sort_order === 'number' && Number.isFinite(body.sort_order) ? body.sort_order : 0,
        is_required: body.is_required ?? true,
        status: body.status ?? true
      }
    );
    const checklist_item_id = rows[0]?.checklist_item_id;
    if (!checklist_item_id) throw httpError(500, 'Failed to create visa checklist item');
    return { checklist_item_id };
  }

  @Put('visa-checklists/{id}')
  @Security('jwt')
  public async updateVisaChecklist(
    @Path() id: number,
    @Body()
    body: Partial<{
      checklist_item_code: string;
      checklist_item_name: string;
      sort_order: number;
      is_required: boolean;
      status: boolean;
    }>
  ): Promise<{ updated: true }> {
    if (!id) throw httpError(400, 'id is required');
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_dep_visa_checklist_master('UPDATE', :id, :checklist_item_code, :checklist_item_name, :sort_order, :is_required, :status, NULL)`,
      {
        id,
        checklist_item_code: typeof body.checklist_item_code === 'string' ? body.checklist_item_code.trim() : null,
        checklist_item_name: typeof body.checklist_item_name === 'string' ? body.checklist_item_name.trim() : null,
        sort_order: typeof body.sort_order === 'number' && Number.isFinite(body.sort_order) ? body.sort_order : null,
        is_required: typeof body.is_required === 'boolean' ? body.is_required : null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Visa checklist item not found');
    return { updated: true };
  }

  @Delete('visa-checklists/{id}')
  @Security('jwt')
  public async disableVisaChecklist(@Path() id: number): Promise<{ disabled: true }> {
    if (!id) throw httpError(400, 'id is required');
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_dep_visa_checklist_master('DISABLE', :id, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Visa checklist item not found');
    return { disabled: true };
  }
}
