import { Module, OnModuleInit } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { Community } from './community.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
    // added Global to keycloakmodule
    // imports: [TypeOrmModule.forFeature([Organization]),KeycloakModule],
    imports: [TypeOrmModule.forFeature([Community])],
    controllers: [CommunityController],
    providers: [CommunityService],
    exports: [CommunityService],
})
export class CommunityModule {
    constructor() {}

    async onModuleInit() {
        console.log('CommunityModule initialized');
    }
}
