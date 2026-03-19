import { Body, Controller, Get, Post, Request, Route, Security, Tags } from 'tsoa';
import { bootstrapFirstAdmin, getSelfProfile, loginWithOtp, loginWithPassword, requestLoginOtp } from '../../services/authService';
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
