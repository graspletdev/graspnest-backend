import { IsString, IsEmail, IsOptional, Length, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty } from 'class-validator';

export class OrganizationSimpleDto {
    @IsNotEmpty()
    id: number;
}

export class CreateCommDto {
    @ApiProperty({ description: 'Unique Community name' })
    @IsString()
    @Length(3, 50)
    communityName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    communityBlocks?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    communityUnitsinBlock?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityAddress?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityPostCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityCity?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityState?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityCountry?: string;

    @ApiProperty({ description: 'Admin first name' })
    @IsString()
    @Length(1, 30)
    communityAdminFirstName: string;

    @ApiProperty({ description: 'Admin last name' })
    @IsString()
    @Length(1, 30)
    communityAdminLastName: string;

    @ApiProperty({ description: 'Admin email address' })
    @IsEmail()
    communityAdminEmail: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityAdminContact?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    communityFeatures?: string;

    @ValidateNested()
    @Type(() => OrganizationSimpleDto)
    organization: OrganizationSimpleDto;
}

export class UpdateCommDto extends PartialType(CreateCommDto) {}

// export interface UpdateCommDto {
// communityName?: string;
// communityType?: string;
// communityBlocks?: number;
// communityUnitsinBlock?: number;
// communityAddress?: string;
// communityPostCode?: string;
// communityCity?: string;
// communityState?: string;
// communityCountry?: string;
// communityAdminFirstName: string;
// communityAdminLastName: string;
// communityAdminEmail: string;
// communityAdminContact?: string;
// communityFeatures?: string;
// }

export interface landlordDetailsDto {
    commId: number;
    commName: string;
    landlordFirstName: string;
    landlordLastName: string;
    unitsCount: number;
    blocksCount: number;
    blockName: string;
    landlordsCount: number;
    tenantsCount: number;
}

export interface CommDashboardDto {
    totals: {
        landlords: number;
        tenants: number;
        unitsCount: number;
        blocksCount: number;
    };
    commlandlordDetails: landlordDetailsDto[];
}
