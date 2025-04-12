import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';
import { KeycloakModule } from './keycloak/keycloak.module';

@Module({
  imports: [KeycloakModule],
  controllers: [AppController],
  providers: [AppService],
})
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST!,
          port: parseInt(process.env.DB_PORT!, 10),
          username: process.env.DB_USERNAME!,
          password: process.env.DB_PASSWORD!,
          database: process.env.DB_NAME!,
          autoLoadEntities: true,
          synchronize: true, // Set to false in production to prevent data loss
        }),
    ],
    providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard, //By default, it will throw a 401 unauthorized when it is unable to verify the JWT token or Bearer header is missing.
        },
        {
          provide: APP_GUARD,
          useClass: ResourceGuard, //Only controllers annotated with @Resource and methods with @Scopes are handled by this guard
        },
        {
          provide: APP_GUARD,
          useClass: RoleGuard, //Permissive by default. Used by controller methods annotated with @Roles
        }
    ],
})
export class AppModule implements OnModuleInit {
    constructor() {}

    async onModuleInit() {
        console.log('AppModule initialized');
    }
}
