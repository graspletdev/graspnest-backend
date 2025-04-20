import { Module, OnModuleInit, Global } from '@nestjs/common';
import KeycloakService from './keycloak.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  KeycloakConnectModule,
  AuthGuard,
  ResourceGuard,
  RoleGuard,
  KeycloakConnectOptions,
} from 'nest-keycloak-connect';
import {keycloakConfig} from './keycloak.config';

//@Global() to KeycloakModule, any module that imports it (or even without importing it) will see the KEYCLOAK_INSTANCE
@Global()
@Module({
  imports: [HttpModule,
            ConfigModule,
            // registerAsync here so KEYCLOAK_INSTANCE is provided
            KeycloakConnectModule.registerAsync({
              imports: [ConfigModule],
              inject: [ConfigService],
              useFactory: keycloakConfig as () => KeycloakConnectOptions,
            }),],
  exports: [KeycloakService,KeycloakConnectModule],
  providers: [
       KeycloakService,
      { provide: APP_GUARD, useClass: AuthGuard    },  // 401 on bad/missing token
      { provide: APP_GUARD, useClass: ResourceGuard},  // @Resource() support
      { provide: APP_GUARD, useClass: RoleGuard    },  // @Roles() support
   ],
})
export class KeycloakModule implements OnModuleInit {
    constructor() {}

    async onModuleInit() {
        console.log('KeycloakModule initialized');
    }
}