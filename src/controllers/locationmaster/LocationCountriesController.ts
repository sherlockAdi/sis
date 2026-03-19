import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type Country = {
  country_id: number;
  country_name: string;
  country_code: string | null;
  iso_code: string | null;
  status: 0 | 1;
  created_at: string;
};

type CountryCreate = {
  country_name: string;
  country_code?: string | null;
  iso_code?: string | null;
  status?: boolean;
};

type CountryUpdate = Partial<CountryCreate>;

@Route('location/countries')
@Tags('Location')
export class LocationCountriesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() include_inactive?: boolean): Promise<Country[]> {
    return callProc<RowDataPacket & Country>(
      `CALL sp_loc_countries('LIST', NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Get('{countryId}')
  @Security('jwt')
  public async get(@Path() countryId: number): Promise<Country> {
    const rows = await callProc<RowDataPacket & Country>(
      `CALL sp_loc_countries('GET', :country_id, NULL, NULL, NULL, NULL, NULL)`,
      { country_id: countryId }
    );
    const row = rows[0];
    if (!row) throw httpError(404, 'Country not found');
    return row;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: CountryCreate): Promise<{ country_id: number }> {
    const rows = await callProc<RowDataPacket & { country_id: number }>(
      `CALL sp_loc_countries('CREATE', NULL, :country_name, :country_code, :iso_code, :status, NULL)`,
      {
        country_name: body.country_name,
        country_code: body.country_code ?? null,
        iso_code: body.iso_code ?? null,
        status: body.status ?? true
      }
    );
    const country_id = rows[0]?.country_id;
    if (!country_id) throw httpError(500, 'Failed to create country');
    return { country_id };
  }

  @Put('{countryId}')
  @Security('jwt')
  public async update(@Path() countryId: number, @Body() body: CountryUpdate): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_loc_countries('UPDATE', :country_id, :country_name, :country_code, :iso_code, :status, NULL)`,
      {
        country_id: countryId,
        country_name: body.country_name ?? null,
        country_code: body.country_code ?? null,
        iso_code: body.iso_code ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Country not found');
    return { updated: true };
  }

  @Delete('{countryId}')
  @Security('jwt')
  public async disable(@Path() countryId: number, @Query() hard?: boolean): Promise<{ disabled: true } | { deleted: true }> {
    if (hard) {
      const rows = await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_loc_countries('DELETE', :country_id, NULL, NULL, NULL, NULL, NULL)`,
        { country_id: countryId }
      );
      if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Country not found');
      return { deleted: true };
    }

    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_loc_countries('DISABLE', :country_id, NULL, NULL, NULL, NULL, NULL)`,
      { country_id: countryId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Country not found');
    return { disabled: true };
  }
}
