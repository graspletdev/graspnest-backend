import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuthGuard } from 'nest-keycloak-connect';
import { OrgService } from './org.service';
import { CreateOrgDto, UpdateOrgDto } from './org.dto';
import { Organization } from './org.entity';
import { ApiResponse } from 'src/model/apiresponse.model';

@ApiTags('Organizations')
@Controller('api/org')
export class OrgController {
    constructor(private readonly orgService: OrgService) {}

    @UseGuards(AuthGuard)
    @Get()
    @SwaggerResponse({ status: 200, description: 'List all organizations', type: Organization, isArray: true })
    async findAll(): Promise<ApiResponse<Organization[]>> {
        const data = await this.orgService.findAll();
        return { result: true, message: 'Fetched organizations', data };
    }

    @UseGuards(AuthGuard)
    @Get(':name')
    @SwaggerResponse({ status: 200, description: 'Get org by name', type: Organization })
    async findOne(@Param('name') name: string): Promise<ApiResponse<Organization>> {
        const data = await this.orgService.findOne(name);
        return { result: true, message: `Fetched organization "${name}"`, data };
    }

    @UseGuards(AuthGuard)
    @Post()
    @SwaggerResponse({ status: 201, description: 'Create a new org', type: Organization })
    async create(@Body() dto: CreateOrgDto): Promise<ApiResponse<Organization>> {
        const data = await this.orgService.create(dto);
        return { result: true, message: 'Organization created', data };
    }

    @UseGuards(AuthGuard)
    @Put(':name')
    @SwaggerResponse({ status: 200, description: 'Update existing org', type: Organization })
    async update(@Param('name') name: string, @Body() dto: UpdateOrgDto): Promise<ApiResponse<Organization>> {
        const data = await this.orgService.update(name, dto);
        return { result: true, message: `Organization "${name}" updated`, data };
    }

    @UseGuards(AuthGuard)
    @Delete(':name')
    @HttpCode(204)
    @SwaggerResponse({ status: 204, description: 'Delete an org' })
    async remove(@Param('name') name: string): Promise<void> {
        await this.orgService.remove(name);
    }
}
