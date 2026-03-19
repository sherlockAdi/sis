import { Controller, Get, Query, Route, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';

type PublicCountry = {
  country_id: number;
  country_name: string;
  country_code: string | null;
  iso_code: string | null;
  status: 0 | 1;
  created_at: string;
};

type PublicState = {
  state_id: number;
  country_id: number;
  country_name: string;
  state_name: string;
  state_code: string | null;
  status: 0 | 1;
  created_at: string;
};

type PublicCity = {
  city_id: number;
  state_id: number;
  state_name: string;
  country_id: number;
  country_name: string;
  city_name: string;
  status: 0 | 1;
  created_at: string;
};

@Route('public/location')
@Tags('Public')
export class PublicLocationController extends Controller {
  @Get('countries')
  public async listCountries(): Promise<PublicCountry[]> {
    return callProc<RowDataPacket & PublicCountry>(
      `CALL sp_loc_countries('LIST', NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: false }
    );
  }

  @Get('states')
  public async listStates(@Query() country_id?: number): Promise<PublicState[]> {
    return callProc<RowDataPacket & PublicState>(
      `CALL sp_loc_states('LIST', NULL, :country_id, NULL, NULL, NULL, :include_inactive)`,
      { country_id: typeof country_id === 'number' ? country_id : null, include_inactive: false }
    );
  }

  @Get('cities')
  public async listCities(@Query() state_id?: number): Promise<PublicCity[]> {
    return callProc<RowDataPacket & PublicCity>(
      `CALL sp_loc_cities('LIST', NULL, :state_id, NULL, NULL, :include_inactive)`,
      { state_id: typeof state_id === 'number' ? state_id : null, include_inactive: false }
    );
  }
}
