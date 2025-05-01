import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, LoginDto, ForgotPasswordDto, AuthRefreshTokenDto } from './auth.dto';
import { ApiResponse } from 'src/model/apiresponse.model';
import { RegisterResponse, LoginResponse } from 'src/model/authresponse.model';
import { Public, Unprotected } from 'nest-keycloak-connect';

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiBody({ type: CreateUserDto })
    async register(@Body() createuser: CreateUserDto): Promise<ApiResponse<RegisterResponse>> {
        return await this.authService.register(createuser);
    }

    @Public()
    @Post('login')
    @ApiBody({ type: LoginDto })
    async login(@Body() login: LoginDto): Promise<ApiResponse<LoginResponse>> {
        return await this.authService.login(login);
    }

    @Public()
    @Post('forget-password')
    @ApiBody({ type: ForgotPasswordDto })
    async forgetPassword(@Body() forgetPassword: ForgotPasswordDto): Promise<ApiResponse<boolean>> {
        return await this.authService.forgetPassword(forgetPassword.email);
    }

    @Public()
    @Post('refreshtoken')
    @ApiBody({ type: AuthRefreshTokenDto })
    async refreshToken(@Body() refreshToken: AuthRefreshTokenDto): Promise<ApiResponse<string>> {
        return await this.authService.refreshToken(refreshToken.refreshToken);
    }
}
