import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type PaymentCategory = {
  payment_category_id: number;
  category_name: string;
  description: string | null;
  status: 0 | 1;
  created_at: string;
};

@Route('masters/payments')
@Tags('Masters')
export class MastersPaymentsController extends Controller {
  @Get('categories')
  @Security('jwt')
  public async listPaymentCategories(@Query() include_inactive?: boolean): Promise<PaymentCategory[]> {
    return callProc<RowDataPacket & PaymentCategory>(
      `CALL sp_pay_payment_categories('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('categories')
  @Security('jwt')
  public async createPaymentCategory(
    @Body() body: { category_name: string; description?: string | null; status?: boolean }
  ): Promise<{ payment_category_id: number }> {
    const rows = await callProc<RowDataPacket & { payment_category_id: number }>(
      `CALL sp_pay_payment_categories('CREATE', NULL, :category_name, :description, :status, NULL)`,
      {
        category_name: body.category_name,
        description: body.description ?? null,
        status: body.status ?? true
      }
    );
    const payment_category_id = rows[0]?.payment_category_id;
    if (!payment_category_id) throw httpError(500, 'Failed to create payment category');
    return { payment_category_id };
  }

  @Put('categories/{id}')
  @Security('jwt')
  public async updatePaymentCategory(
    @Path() id: number,
    @Body() body: Partial<{ category_name: string; description: string | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_pay_payment_categories('UPDATE', :id, :category_name, :description, :status, NULL)`,
      {
        id,
        category_name: body.category_name ?? null,
        description: body.description ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Payment category not found');
    return { updated: true };
  }

  @Delete('categories/{id}')
  @Security('jwt')
  public async disablePaymentCategory(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_pay_payment_categories('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Payment category not found');
    return { disabled: true };
  }
}
