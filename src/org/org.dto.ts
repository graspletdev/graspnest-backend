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
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    regNum?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    vatID?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    website?: string;

    @ApiProperty({ description: 'Admin first name' })
    @IsString()
    @Length(1, 30)
    adminFirst: string;

    @ApiProperty({ description: 'Admin last name' })
    @IsString()
    @Length(1, 30)
    adminLast: string;

    @ApiProperty({ description: 'Admin email address' })
    @IsEmail()
    adminEmail: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    adminContact?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    docUpload?: string;
}

export class UpdateOrgDto extends CreateOrgDto {}

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
    orgId: string;
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

export interface OrgWithUserDto extends CreateOrgDto {}
