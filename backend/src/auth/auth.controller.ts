import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PermissionsGuard } from 'src/permissions/permissions.guard';
import { Permissions } from 'src/permissions/permissions.decorator';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("register")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create-user')
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

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = (req.user as { id?: string } | undefined)?.id;
    return this.authService.changePassword(userId, dto);
  }
}
