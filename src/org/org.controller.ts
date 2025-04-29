import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, UseGuards, Request, BadRequestException } from '@nestjs/common';
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

    @Get('dashboard')
    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    async dashboard(@Request() req): Promise<ApiResponse<OrgDashboardDto>> {
        try {
            const roles = (req.user?.resource_access?.GraspNestClient?.roles as string[]) || [];
            const email = req.user?.email as string;

            if (!roles.length) {
                throw new Error('User roles not found in token.');
            }

            let data: OrgDashboardDto;

            if (roles.includes('SuperAdmin')) {
                data = await this.orgService.findAll();
            } else if (roles.includes('OrgAdmin')) {
                if (!email) {
                    throw new Error('OrgAdmin email not found in token.');
                }
                data = await this.orgService.dashboard(email);
            } else {
                throw new Error('Unauthorized role.');
            }

            return { result: true, message: 'Dashboard data fetched successfully', data };
        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
            throw new BadRequestException(error.message || 'Failed to fetch dashboard data.');
        }
    }

    @Get()
    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @SwaggerResponse({ status: 200, description: 'List all organizations', type: Organization, isArray: true })
    async findAll(): Promise<ApiResponse<OrgDashboardDto>> {
        try {
            const data = await this.orgService.findAll();
            return { result: true, message: 'Fetched organizations', data };
        } catch (error) {
            console.error('Error fetching organizations:', error.message);
            throw new BadRequestException('Failed to fetch organizations.');
        }
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
}
