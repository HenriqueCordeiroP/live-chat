import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_NO_AUTH_KEY } from '../decorators/no-auth.decorator';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isNoAuth = this.reflector.getAllAndOverride<boolean>(IS_NO_AUTH_KEY, [context.getHandler(), context.getClass()]);
    if (isNoAuth) {
      return true;
    }

    return super.canActivate(context);
  }
}
