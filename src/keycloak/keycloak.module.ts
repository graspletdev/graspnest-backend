import { Module, OnModuleInit } from '@nestjs/common';
import KeycloakService from './keycloak.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  exports: [KeycloakService],
  providers: [KeycloakService]
})
export class KeycloakModule implements OnModuleInit {
    constructor() {}

    async onModuleInit() {
        console.log('KeycloakModule initialized');
    }
}
