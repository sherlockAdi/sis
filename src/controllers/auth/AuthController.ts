import { Body, Controller, Get, Post, Request, Route, Security, Tags } from 'tsoa';
import { bootstrapFirstAdmin, getSelfProfile, loginWithOtp, loginWithPassword, registerUser, requestLoginOtp } from '../../services/authService';
import { httpError } from '../../utils/httpErrors';

type LoginRequest = {
  username: string;
  password: string;
};

type LoginResponse = {
  token: string;
};

type LoginOtpRequest = {
  username: string;
};

type LoginOtpVerifyRequest = {
  username: string;
  otp: string;
};

type LoginOtpRequestResponse = {
  sent: true;
};

type BootstrapRequest = {
  username: string;
  password: string;
};

type RegisterRequest = {
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email?: string | null;
  phone?: string | null;
  password: string;
};

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  @Post('login')
  public async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    return loginWithPassword(body.username, body.password);
  }

  @Post('otp/request')
  public async requestOtp(@Body() body: LoginOtpRequest): Promise<LoginOtpRequestResponse> {
    await requestLoginOtp(body.username);
    return { sent: true };
  }

  @Post('otp/verify')
  public async verifyOtp(@Body() body: LoginOtpVerifyRequest): Promise<LoginResponse> {
    return loginWithOtp(body.username, body.otp);
  }

  @Post('register')
  public async register(@Body() body: RegisterRequest): Promise<{ token: string; user_id: number; username: string }> {
    return registerUser(body);
  }

  @Get('me')
  @Security('jwt')
  public async me(@Request() req: any) {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    return getSelfProfile(user.user_id);
  }

  @Post('bootstrap')
  public async bootstrap(@Body() body: BootstrapRequest): Promise<LoginResponse> {
    return bootstrapFirstAdmin(body.username, body.password);
  }
}
