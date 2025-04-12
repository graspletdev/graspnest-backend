import { ConfigService } from '@nestjs/config';
import { KeycloakConnectOptions, PolicyEnforcementMode, TokenValidation } from 'nest-keycloak-connect';

export const keycloakConfig = (configService: ConfigService): KeycloakConnectOptions => ({
    authServerUrl: configService.get<string>('KEYCLOAK_URL'),
    realm: configService.get<string>('KEYCLOAK_REALM'),
    clientId: configService.get<string>('KEYCLOAK_CLIENT_ID'),
    secret: configService.get<string>('KEYCLOAK_CLIENT_SECRET'),
    cookieKey: 'KEYCLOAK_JWT',
    policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
    tokenValidation: TokenValidation.ONLINE,
});
