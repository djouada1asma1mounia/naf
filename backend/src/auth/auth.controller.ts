import { Body, Controller, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("register")
  register(@Body() RegisterUserDto: RegisterUserDto) {
    return this.authService.register(RegisterUserDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() LoginDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(LoginDto);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    })

    return {
      data: result.data,
      accessToken: result.accessToken,
      message: result.message,
    }
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refreshToken'];

    return await this.authService.refreshToken(refreshToken);
  }
}
