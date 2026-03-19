import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type City = {
  city_id: number;
  state_id: number;
  state_name: string;
  country_id: number;
  country_name: string;
  city_name: string;
  status: 0 | 1;
  created_at: string;
};

type CityCreate = {
  state_id: number;
  city_name: string;
  status?: boolean;
};

type CityUpdate = Partial<CityCreate>;

@Route('location/cities')
@Tags('Location')
export class LocationCitiesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() state_id?: number, @Query() include_inactive?: boolean): Promise<City[]> {
    return callProc<RowDataPacket & City>(
      `CALL sp_loc_cities('LIST', NULL, :state_id, NULL, NULL, :include_inactive)`,
      { state_id: state_id ?? null, include_inactive: include_inactive ?? false }
    );
  }

  @Get('{cityId}')
  @Security('jwt')
  public async get(@Path() cityId: number): Promise<City> {
    const rows = await callProc<RowDataPacket & City>(
      `CALL sp_loc_cities('GET', :city_id, NULL, NULL, NULL, NULL)`,
      { city_id: cityId }
    );
    const row = rows[0];
    if (!row) throw httpError(404, 'City not found');
    return row;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: CityCreate): Promise<{ city_id: number }> {
    try {
      const rows = await callProc<RowDataPacket & { city_id: number }>(
        `CALL sp_loc_cities('CREATE', NULL, :state_id, :city_name, :status, NULL)`,
        {
          state_id: body.state_id,
          city_name: body.city_name,
          status: body.status ?? true
        }
      );
      const city_id = rows[0]?.city_id;
      if (!city_id) throw httpError(500, 'Failed to create city');
      return { city_id };
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.includes('invalid state_id')) {
        throw httpError(400, 'Invalid state_id');
      }
      throw e;
    }
  }

  @Put('{cityId}')
  @Security('jwt')
  public async update(@Path() cityId: number, @Body() body: CityUpdate): Promise<{ updated: true }> {
    try {
      const rows = await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_loc_cities('UPDATE', :city_id, :state_id, :city_name, :status, NULL)`,
        {
          city_id: cityId,
          state_id: typeof body.state_id === 'number' ? body.state_id : null,
          city_name: body.city_name ?? null,
          status: typeof body.status === 'boolean' ? body.status : null
        }
      );
      if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'City not found');
      return { updated: true };
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.includes('invalid state_id')) {
        throw httpError(400, 'Invalid state_id');
      }
      throw e;
    }
  }

  @Delete('{cityId}')
  @Security('jwt')
  public async disable(@Path() cityId: number, @Query() hard?: boolean): Promise<{ disabled: true } | { deleted: true }> {
    if (hard) {
      const rows = await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_loc_cities('DELETE', :city_id, NULL, NULL, NULL, NULL)`,
        { city_id: cityId }
      );
      if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'City not found');
      return { deleted: true };
    }

    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_loc_cities('DISABLE', :city_id, NULL, NULL, NULL, NULL)`,
      { city_id: cityId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'City not found');
    return { disabled: true };
  }
}
