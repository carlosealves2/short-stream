import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthProxyController } from './auth-proxy.controller';
import { AuthProxyService } from './auth-proxy.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [AuthProxyController],
  providers: [AuthProxyService],
})
export class AuthProxyModule {}
