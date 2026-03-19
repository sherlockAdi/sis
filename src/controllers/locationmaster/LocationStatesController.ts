import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type State = {
  state_id: number;
  country_id: number;
  country_name: string;
  state_name: string;
  state_code: string | null;
  status: 0 | 1;
  created_at: string;
};

type StateCreate = {
  country_id: number;
  state_name: string;
  state_code?: string | null;
  status?: boolean;
};

type StateUpdate = Partial<StateCreate>;

@Route('location/states')
@Tags('Location')
export class LocationStatesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() country_id?: number, @Query() include_inactive?: boolean): Promise<State[]> {
    return callProc<RowDataPacket & State>(
      `CALL sp_loc_states('LIST', NULL, :country_id, NULL, NULL, NULL, :include_inactive)`,
      { country_id: country_id ?? null, include_inactive: include_inactive ?? false }
    );
  }

  @Get('{stateId}')
  @Security('jwt')
  public async get(@Path() stateId: number): Promise<State> {
    const rows = await callProc<RowDataPacket & State>(
      `CALL sp_loc_states('GET', :state_id, NULL, NULL, NULL, NULL, NULL)`,
      { state_id: stateId }
    );
    const row = rows[0];
    if (!row) throw httpError(404, 'State not found');
    return row;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: StateCreate): Promise<{ state_id: number }> {
    try {
      const rows = await callProc<RowDataPacket & { state_id: number }>(
        `CALL sp_loc_states('CREATE', NULL, :country_id, :state_name, :state_code, :status, NULL)`,
        {
          country_id: body.country_id,
          state_name: body.state_name,
          state_code: body.state_code ?? null,
          status: body.status ?? true
        }
      );
      const state_id = rows[0]?.state_id;
      if (!state_id) throw httpError(500, 'Failed to create state');
      return { state_id };
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.includes('invalid country_id')) {
        throw httpError(400, 'Invalid country_id');
      }
      throw e;
    }
  }

  @Put('{stateId}')
  @Security('jwt')
  public async update(@Path() stateId: number, @Body() body: StateUpdate): Promise<{ updated: true }> {
    try {
      const rows = await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_loc_states('UPDATE', :state_id, :country_id, :state_name, :state_code, :status, NULL)`,
        {
          state_id: stateId,
          country_id: typeof body.country_id === 'number' ? body.country_id : null,
          state_name: body.state_name ?? null,
          state_code: body.state_code ?? null,
          status: typeof body.status === 'boolean' ? body.status : null
        }
      );
      if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'State not found');
      return { updated: true };
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.includes('invalid country_id')) {
        throw httpError(400, 'Invalid country_id');
      }
      throw e;
    }
  }

  @Delete('{stateId}')
  @Security('jwt')
  public async disable(@Path() stateId: number, @Query() hard?: boolean): Promise<{ disabled: true } | { deleted: true }> {
    if (hard) {
      const rows = await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_loc_states('DELETE', :state_id, NULL, NULL, NULL, NULL, NULL)`,
        { state_id: stateId }
      );
      if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'State not found');
      return { deleted: true };
    }

    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_loc_states('DISABLE', :state_id, NULL, NULL, NULL, NULL, NULL)`,
      { state_id: stateId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'State not found');
    return { disabled: true };
  }
}
