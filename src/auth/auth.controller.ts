import { Body, Controller, Post, Version } from '@nestjs/common';
import { AuthService } from './auth.service';
import { NoAuth } from './decorators/no-auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Version(['1'])
  @NoAuth()
  @Post('sign-up')
  signUp(@Body() userDto: { username: string; password: string }) {
    return this.authService.signUp(userDto);
  }

  @Version(['1'])
  @NoAuth()
  @Post('sign-in')
  signIn(@Body() signInDto: { username: string; password: string }) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
