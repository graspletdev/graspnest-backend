import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { CreateUserDto, LoginDto } from './auth.dto';
import { ApiResponse } from 'src/model/apiresponse.model';
import { RegisterResponse, LoginResponse } from 'src/model/authresponse.model';
import { UserStatus } from 'src/model/user.model';
import KeycloakService from 'src/keycloak/keycloak.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly keycloakService: KeycloakService,
        private readonly userService: UserService
    ) {}

    async register(user: CreateUserDto): Promise<ApiResponse<RegisterResponse>> {
        //Username to Lowercase
        user.username = user.username.toLowerCase();

        try {
            var userToCreate = new User();
            userToCreate.email = user.username;
            userToCreate.username = user.username;
            //             userToCreate.password = user.password;
            userToCreate.firstName = user.firstName;
            userToCreate.lastName = user.lastName;
            userToCreate.role = user.role;
            userToCreate.contact = user.contact;
            const existingUser = await this.userService.findOneByUsername(userToCreate.username);
            if (existingUser) {
                //throw new BadRequestException('User already exists');
                return {
                    result: false,
                    message: 'User already exists',
                };
            }
            //             const hashedPassword = await bcrypt.hash(userToCreate.password, 10);
            //             userToCreate.password = hashedPassword;
            await this.userService.createUser(userToCreate);
            const userId = await this.keycloakService.registerUserWithClientRole({
                username: userToCreate.username,
                //                 password: user.password,
                roles: [userToCreate.role],
                firstName: userToCreate.firstName,
                lastName: userToCreate.lastName,
            });
            console.log('userid', userId);
            try {
                var setPasswordEmailResponse = await this.keycloakService.sendNewUserPasswordResetEmail(userId);
                if (setPasswordEmailResponse == true) {
                    return {
                        message: 'Registration complete!.<br>Please check your email and verify your address to activate your account and set your Password.',
                        data: {
                            userId: userToCreate.username,
                            status: UserStatus.PENDING,
                        },
                        result: true,
                    };
                } else {
                    //throw new BadRequestException('Error sending verification email');
                    return {
                        result: false,
                        message: 'Error sending verification email',
                    };
                }
            } catch (error) {
                console.log('error', error);
                //throw new BadRequestException('Error sending verification email');
                return {
                    result: false,
                    message: 'Error Sending verification email',
                };
            }
        } catch (error) {
            return {
                result: false,
                message: error?.message ?? 'Failed to register',
            };
        }
    }

    async login(credentials: LoginDto): Promise<ApiResponse<LoginResponse>> {
        // Username to Lowercase
        credentials.username = credentials.username.toLowerCase();
        try {
            const user = await this.userService.findOneByUsername(credentials.username);
            if (!user) {
                //throw new BadRequestException('User not found');
                return { message: 'User not found', result: false };
            }
            //const isMatch = await bcrypt.compare(credentials.password, user.password);
            //if (!isMatch) {
            //throw new BadRequestException('Invalid password');
            //return { message: "Invalid password entered. Please try again.", result: false };
            //}
            console.log('checking with keycloak', credentials);
            var loginResponse = await this.keycloakService.loginUser(credentials.username, credentials.password);
            if (loginResponse != undefined) {
                return {
                    message: 'User logged in successfully',
                    data: loginResponse as LoginResponse,
                    result: true,
                };
            } else {
                //throw new BadRequestException('Error logging in');
                return { message: 'Error logging in', result: false };
            }
        } catch (error) {
            return {
                result: false,
                message: error?.response?.data?.error_description,
            };
        }
    }

    async forgetPassword(username: string): Promise<ApiResponse<boolean>> {
        // Username to Lowercase
        username = username.toLowerCase();
        var passwordResetResponse = await this.keycloakService.sendPasswordResetEmail(username);
        if (passwordResetResponse == true) {
            return {
                result: true,
                data: true,
                message: 'Password reset request successful.<br>Check your email for instructions to reset your password.',
            };
        } else {
            //throw new BadRequestException('Error sending password reset email');
            // Currently Only one false condition from keycloak sendPasswordResetEmail function - User not found
            return {
                result: false,
                data: false,
                message: 'Invalid Email Address.<br>Please check and enter a valid email to reset your password.',
            };
        }
    }

    async refreshToken(refreshToken: string): Promise<ApiResponse<string>> {
        var newToken = await this.keycloakService.refreshToken(refreshToken);
        return {
            result: true,
            data: newToken,
            message: '',
        };
    }
}
