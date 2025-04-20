import { Module, OnModuleInit } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [HttpModule, KeycloakModule, UserModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule implements OnModuleInit {
    constructor(private readonly authService: AuthService) {}

    async onModuleInit() {
        console.log('AuthModule initialized');
    }
}