import axios from 'axios';
import jwt from 'jsonwebtoken';
import { TokenResponse } from './tokenresponse.model';
import { LoginResponse, RefreshTokenResponse } from 'src/model/loginresponse.model';

class KeycloakService {
    private keycloakUrl: string;
    private adminClientId: string;
    private username: string;
    private password: string;
    private realmName: string;
    private clientId: string;
    private clientSecret: string;
    private app_redirect_uri: string; //app redirect url for send verify email

    constructor() {
        this.keycloakUrl = process.env.KEYCLOAK_URL;
        this.clientId = process.env.KEYCLOAK_CLIENT_ID;
        this.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
        this.adminClientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
        this.username = process.env.KEYCLOAK_ADMIN_USERNAME;
        this.password = process.env.KEYCLOAK_ADMIN_PASSWORD;
        this.realmName = process.env.KEYCLOAK_REALM;
        this.app_redirect_uri = process.env.APP_REDIRECT_URI;
        console.log(this.clientId);
        console.log(this.clientSecret);
    }

    public async getAdminToken(): Promise<TokenResponse> {
        try {
            const response = await axios.post<TokenResponse>(
                `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`,
                new URLSearchParams({
                    client_id: this.adminClientId,
                    username: this.username,
                    password: this.password,
                    grant_type: 'password',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to get admin token', error);
            throw error;
        }
    }


    public async registerUser(user: {
        username: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<string> {
        try {
            const tokenResponse = await this.getAdminToken();
            const createUserResponse = await axios.post(
                `${this.keycloakUrl}/admin/realms/${this.realmName}/users`,
                {
                    username: user.username,
                    email: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    enabled: true,
                    credentials: [{ type: 'password', value: user.password, temporary: false }],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                }
            );
            const userId = createUserResponse.headers.location.split('/').pop();
            return userId;
        } catch (error) {
            console.error('Failed to register user', error);
            throw error;
        }
    }

    public async loginUser(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await axios.post<LoginResponse>(
                `${this.keycloakUrl}/realms/${this.realmName}/protocol/openid-connect/token`,
                new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    username,
                    password,
                    grant_type: 'password',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            return response.data as LoginResponse;
        } catch (error) {
            console.error('Failed to login user', error?.response?.data?.error_description);
            throw error;
        }
    }

    public async refreshToken(token: string): Promise<string> {
        try {
            const response = await axios.post<RefreshTokenResponse>(
                `${this.keycloakUrl}/realms/${this.realmName}/protocol/openid-connect/token`,
                new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: token,
                    grant_type: 'refresh_token',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            return response.data as string;
        } catch (error) {
            console.error('Failed to refresh token', error?.response?.data?.error_description);
            throw error;
        }
    }

    public async checkUserExists(username: string): Promise<boolean> {
        try {
            var adminToken = await this.getAdminToken();
            const response = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realmName}/users`, {
                headers: {
                    Authorization: `Bearer ${adminToken.access_token}`,
                },
                params: {
                    username: username,
                },
            });

            return response.data.length > 0;
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }

    public isEmailVerified(accessToken: string): boolean {
        const decodedToken = jwt.decode(accessToken) as jwt.JwtPayload;
        return decodedToken.email_verified;
    }
    // execute-actions-mail with UPDATE_PASSWORD and VERIFY_EMAIL are using same executeActions.tfl - Same Email Subject and Content (links are different)
    // But We need to have different Email Subject and Email Content for UserRegistrationVerifyEmail and ResetCredentials
    // So We are using send-verify-email which uses email-verification.ftl for UserRegistrationVerifyEmail
    // execute-actions-email with UPDATE_PASSWORD for customized content for ResetCredentials
    public async sendNewUserVerificationEmail(userId: string): Promise<boolean> {
        console.log('sending verification email to user ID: ' + userId);
        const tokenResponse = await this.getAdminToken();
        const config = {
            method: 'PUT',
            url: `${this.keycloakUrl}/admin/realms/${this.realmName}/users/${userId}/send-verify-email`,
            params: {
                redirect_uri: this.app_redirect_uri,
                client_id: this.clientId,
            },
            headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
                'Content-Type': 'application/json',
            },
        };
        try {
            const response = await axios(config);
            console.log('Verification email sent:', response.data);
            return true;
        } catch (error) {
            if (error.response) {
                console.error('Failed to send verify email:', error.response.data);
                console.error('Status:', error.response.status);
                console.error('Headers:', error.response.headers);
            } else if (error.request) {
                console.error('Request error:', error.request);
            } else {
                console.error('Error:', error.message);
            }
            throw error;
        }
    }

    public async sendPasswordResetEmail(email: string): Promise<boolean> {
        try {
            var adminToken = await this.getAdminToken();
            // Get user ID by email
            const usersResponse = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realmName}/users`, {
                headers: {
                    Authorization: `Bearer ${adminToken.access_token}`,
                },
                params: {
                    email: email,
                },
            });
            //console.log(usersResponse)
            if (usersResponse.data.length === 0) {
                throw new Error('User not found');
            }

            const userId = usersResponse.data[0].id;

            // Send password reset email
            await axios.put(
                `${this.keycloakUrl}/admin/realms/${this.realmName}/users/${userId}/execute-actions-email`,
                ['UPDATE_PASSWORD'],
                {
                    headers: {
                        Authorization: `Bearer ${adminToken.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        redirect_uri: this.app_redirect_uri,
                        client_id: this.clientId,
                    },
                }
            );

            console.log(`Password reset email sent to ${email}`);
            return true;
        } catch (exception: any) {
            console.log(`failed to send password reset email, error: ${exception} `);
            return false;
            throw exception;
        }
    }

    public async resetPasswordAsync(userId: string, key: string, newPassword: string): Promise<boolean> {
        const tokenResponse = await this.getAdminToken();
        await axios.put(
            `${this.keycloakUrl}/admin/realms/${this.realmName}/users/${userId}/reset-password`,
            {
                type: 'password',
                value: newPassword,
                temporary: false,
                key: key,
            },
            {
                headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return true;
    }

    public async getUsernameById(userId: string): Promise<string> {
        const tokenResponse = await this.getAdminToken();
        const userUrl = `${this.keycloakUrl}/admin/realms/${this.realmName}/users/${userId}`;

        const response = await axios.get(userUrl, {
            headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
            },
        });

        const user = response.data;
        return user.username;
    }
}

export default KeycloakService;
