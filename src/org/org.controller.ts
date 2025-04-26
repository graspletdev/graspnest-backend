import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { OrgService } from './org.service';
import { CreateOrgDto, UpdateOrgDto, OrgDashboardDto } from './org.dto';
import { Organization } from './org.entity';
import { ApiResponse } from 'src/model/apiresponse.model';
import { AuthGuard, RoleGuard, Roles, Public } from 'nest-keycloak-connect';

@ApiTags('Organizations')
@UseGuards(AuthGuard, RoleGuard)
@Controller('api/org')
export class OrgController {
    constructor(private readonly orgService: OrgService) {}

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Get()
    @SwaggerResponse({ status: 200, description: 'List all organizations', type: Organization, isArray: true })
    async findAll(): Promise<ApiResponse<Organization[]>> {
        const data = await this.orgService.findAll();
        return { result: true, message: 'Fetched organizations', data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Get(':name')
    @SwaggerResponse({ status: 200, description: 'Get org by name', type: Organization })
    async findOne(@Param('name') name: string): Promise<ApiResponse<Organization>> {
        const data = await this.orgService.findOne(name);
        return { result: true, message: `Fetched organization "${name}"`, data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Post()
    @SwaggerResponse({ status: 201, description: 'Create a new org', type: Organization })
    async create(@Body() dto: CreateOrgDto): Promise<ApiResponse<Organization>> {
        const data = await this.orgService.create(dto);
        return { result: true, message: 'Organization created', data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Put(':name')
    @SwaggerResponse({ status: 200, description: 'Update existing org', type: Organization })
    async update(@Param('name') name: string, @Body() dto: UpdateOrgDto): Promise<ApiResponse<Organization>> {
        const data = await this.orgService.update(name, dto);
        return { result: true, message: `Organization "${name}" updated`, data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Delete(':name')
    @HttpCode(204)
    @SwaggerResponse({ status: 204, description: 'Delete an org' })
    async remove(@Param('name') name: string): Promise<void> {
        await this.orgService.remove(name);
    }

    @UseGuards(AuthGuard)
    @Get('dashboard')
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    async dashboard(@Request() req): Promise<ApiResponse<OrgDashboardDto>> {
        const orgAdminEmail = (req.user as any).email as string;
        const data = await this.orgService.dashboard(orgAdminEmail);

        return {
            result: true,
            message: 'Org Dashboard data fetched successfully',
            data,
        };
    }
}
