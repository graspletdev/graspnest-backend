import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    username: string;

    //     @ApiProperty()
    //     @IsNotEmpty()
    //     password: string;

    @ApiProperty()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty()
    contact: string;

    @ApiProperty()
    @IsNotEmpty()
    role: string;
}

export class LoginDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'User ID' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Verification key' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ description: 'New password' })
    @IsString()
    @IsNotEmpty()
    newPassword: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ description: 'User email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class AuthRefreshTokenDto {
    @IsNotEmpty()
    refreshToken: string;
}
