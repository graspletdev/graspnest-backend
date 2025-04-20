import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakConnectModule, AuthGuard, ResourceGuard, RoleGuard } from 'nest-keycloak-connect';
import { keycloakConfig } from './keycloak/keycloak.config';
import { KeycloakModule } from './keycloak/keycloak.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrgModule } from './org/org.module';
import { CommunityModule } from './community/community.module';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          autoLoadEntities: true,
          synchronize: true, // Set to false in production to prevent data loss
        }),
        // Register KeycloakConnectModule asynchronously
//         KeycloakConnectModule.registerAsync({
//           imports: [ConfigModule],
//           inject: [ConfigService],
//           useFactory: keycloakConfig,
//         }),
        KeycloakModule,
        AuthModule,
        UserModule,
        OrgModule,
        CommunityModule
    ],
    providers: []
//         {
//           provide: APP_GUARD,
//           useClass: AuthGuard, //By default, it will throw a 401 unauthorized when it is unable to verify the JWT token or Bearer header is missing.
//         },
//         {
//           provide: APP_GUARD,
//           useClass: ResourceGuard, //Only controllers annotated with @Resource and methods with @Scopes are handled by this guard
//         },
//         {
//           provide: APP_GUARD,
//           useClass: RoleGuard, //Permissive by default. Used by controller methods annotated with @Roles
//         }
//     ],
})
export class AppModule implements OnModuleInit {
    constructor() {}

    async onModuleInit() {
        console.log('AppModule initialized');
    }
}
