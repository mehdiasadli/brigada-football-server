import { CanActivate, Injectable } from '@nestjs/common';
import { appConfig } from '../config';

@Injectable()
export class DevGuard implements CanActivate {
  canActivate(): boolean {
    return appConfig.NODE_ENV !== 'production';
  }
}
