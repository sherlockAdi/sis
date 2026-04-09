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

type Currency = {
  currency_id: number;
  currency_code: string;
  currency_name: string;
  symbol: string | null;
  country_id: number | null;
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

  @Get('currencies')
  @Security('jwt')
  public async listCurrencies(@Query() include_inactive?: boolean): Promise<Currency[]> {
    return callProc<RowDataPacket & Currency>(
      `CALL sp_pay_currencies('LIST', NULL, NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('currencies')
  @Security('jwt')
  public async createCurrency(
    @Body() body: { currency_code: string; currency_name: string; symbol?: string | null; country_id?: number | null; status?: boolean }
  ): Promise<{ currency_id: number }> {
    const rows = await callProc<RowDataPacket & { currency_id: number }>(
      `CALL sp_pay_currencies('CREATE', NULL, :currency_code, :currency_name, :symbol, :country_id, :status, NULL)`,
      {
        currency_code: body.currency_code,
        currency_name: body.currency_name,
        symbol: body.symbol ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        status: body.status ?? true
      }
    );
    const currency_id = rows[0]?.currency_id;
    if (!currency_id) throw httpError(500, 'Failed to create currency');
    return { currency_id };
  }

  @Put('currencies/{id}')
  @Security('jwt')
  public async updateCurrency(
    @Path() id: number,
    @Body()
    body: Partial<{ currency_code: string; currency_name: string; symbol: string | null; country_id: number | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_pay_currencies('UPDATE', :id, :currency_code, :currency_name, :symbol, :country_id, :status, NULL)`,
      {
        id,
        currency_code: body.currency_code ?? null,
        currency_name: body.currency_name ?? null,
        symbol: body.symbol ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Currency not found');
    return { updated: true };
  }

  @Delete('currencies/{id}')
  @Security('jwt')
  public async disableCurrency(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_pay_currencies('DISABLE', :id, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Currency not found');
    return { disabled: true };
  }
}
