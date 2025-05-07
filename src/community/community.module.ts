import { Module, OnModuleInit } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { Community } from './community.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { Landlord } from 'src/landlord/landlord.entity';
import { Organization } from 'src/org/org.entity';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
    // added Global to keycloakmodule
    // imports: [TypeOrmModule.forFeature([Organization]),KeycloakModule],
    imports: [
        TypeOrmModule.forFeature([Organization]),
        TypeOrmModule.forFeature([Community]),
        TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([Landlord]),
    ],
    controllers: [CommunityController],
    providers: [CommunityService, UserService, AuthService],
    exports: [CommunityService],
})
export class CommunityModule {
    constructor() {}

    async onModuleInit() {
        console.log('CommunityModule initialized');
    }
}
