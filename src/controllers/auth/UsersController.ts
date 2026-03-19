import { Body, Controller, Delete, Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { hashPassword } from '../../services/authService';
import { httpError } from '../../utils/httpErrors';

type User = {
  user_id: number;
  role_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  status: boolean;
  last_login: string | null;
  created_at: string;
};

type UserCreate = {
  role_id: number;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  status?: boolean;
};

type UserUpdate = Partial<Omit<UserCreate, 'username'>> & { password?: string | null; username?: string };

@Route('users')
@Tags('Users')
export class UsersController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<User[]> {
    const rows = await callProc<RowDataPacket & User>(`CALL sp_users_list()`);
    return rows;
  }

  @Get('{userId}')
  @Security('jwt')
  public async get(@Path() userId: number): Promise<User> {
    const rows = await callProc<RowDataPacket & User>(`CALL sp_users_get(:userId)`, { userId });
    const user = rows[0];
    if (!user) throw httpError(404, 'User not found');
    return user;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: UserCreate): Promise<{ user_id: number }> {
    const password_hash = body.password ? await hashPassword(body.password) : null;
    try {
      const rows = await callProc<RowDataPacket & { user_id: number }>(
        `CALL sp_users_create(:role_id, :first_name, :last_name, :username, :email, :phone, :password_hash, :status)`,
        {
          role_id: body.role_id,
          first_name: body.first_name ?? null,
          last_name: body.last_name ?? null,
          username: body.username,
          email: body.email ?? null,
          phone: body.phone ?? null,
          password_hash,
          status: body.status ?? true
        }
      );
      const user_id = rows[0]?.user_id;
      if (!user_id) throw httpError(500, 'Failed to create user');
      return { user_id };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'username/email already exists');
      throw e;
    }
  }

  @Put('{userId}')
  @Security('jwt')
  public async update(@Path() userId: number, @Body() body: UserUpdate): Promise<{ updated: true }> {
    const password_hash = body.password ? await hashPassword(body.password) : null;
    try {
      const rows = await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_users_update(:userId, :role_id, :first_name, :last_name, :username, :email, :phone, :password_hash, :status)`,
        {
          userId,
          role_id: typeof body.role_id === 'number' ? body.role_id : null,
          first_name: body.first_name ?? null,
          last_name: body.last_name ?? null,
          username: body.username ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
          password_hash,
          status: typeof body.status === 'boolean' ? body.status : null
        }
      );
      if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'User not found');
      return { updated: true };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'username/email already exists');
      throw e;
    }
  }

  @Delete('{userId}')
  @Security('jwt')
  public async disable(@Path() userId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(`CALL sp_users_disable(:userId)`, { userId });
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'User not found');
    return { disabled: true };
  }
}
