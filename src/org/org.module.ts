import { Module, OnModuleInit } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './org.entity';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { Community } from 'src/community/community.entity';
import { Landlord } from 'src/landlord/landlord.entity';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
    // added Global to keycloakmodule
    //imports: [TypeOrmModule.forFeature([Organization]),KeycloakModule],
    imports: [
        TypeOrmModule.forFeature([Organization]),
        TypeOrmModule.forFeature([Community]),
        TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([Landlord]),
    ],
    controllers: [OrgController],
    providers: [OrgService, UserService, AuthService],
    exports: [OrgService],
})
export class OrgModule {
    constructor() {}

    async onModuleInit() {
        console.log('OrgModule initialized');
    }
}
