import { IsString, IsEmail, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateOrgDto {
    @ApiProperty({ description: 'Unique organization name' })
    @IsString()
    @Length(3, 50)
    orgName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgAddress?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgPostCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgCity?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgState?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgCountry?: string;

    @ApiProperty({ description: 'Admin first name' })
    @IsString()
    @Length(1, 30)
    orgAdminFirstName: string;

    @ApiProperty({ description: 'Admin last name' })
    @IsString()
    @Length(1, 30)
    orgAdminLastName: string;

    @ApiProperty({ description: 'Admin email address' })
    @IsEmail()
    orgAdminEmail: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgAdminContact?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgLicense?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orgBankDetails?: string;
}

export class UpdateOrgDto extends PartialType(CreateOrgDto) {}

// export interface UpdateOrgDto {
//  orgName?: string,
//  orgType?: string;
//  orgAddress?: string;
//  orgPostCode?: string;
//  orgCity?: string;
//  orgState?: string;
//  orgCountry?: string;
//  orgAdminFistName?: string;
//  orgAdminLastName?: string;
//  orgAdminEmail?: string;
//  orgAdminContact?: string;
//  orgLicense?: string;
//  orgBankDetails?: string;
// }

export interface CommDetailsDto {
    orgId: number;
    orgName: string;
    commName: string;
    commAdminFirstName: string;
    commAdminLastName: string;
    communitiesCount: number;
    landlordsCount: number;
    tenantsCount: number;
}

export interface OrgDashboardDto {
    totals: {
        communities: number;
        landlords: number;
        tenants: number;
    };
    orgCommDetails: CommDetailsDto[];
}
