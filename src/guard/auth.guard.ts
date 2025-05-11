import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const isPublic = this.reflector.get<boolean>('isPublic', handler);

    // If the route has the 'isPublic' metadata, bypass the guard
    if (isPublic) {
      return true;
    }

    const { headers } = request;

    const receivedApiToken = headers['x-ai-eduminer-token'];
    const AI_EDUMINER_TOKEN =
      this.configService.get<string>('AI_EDUMINER_TOKEN');

    if (!receivedApiToken || receivedApiToken !== AI_EDUMINER_TOKEN) {
      throw new UnauthorizedException('Invalid API token');
    }

    return true;
  }
}
