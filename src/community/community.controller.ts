import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuthGuard, RoleGuard, Roles, Public } from 'nest-keycloak-connect';
import { CommunityService } from './community.service';
import { CreateCommDto, UpdateCommDto, CommDashboardDto, CommWithUserDto } from './community.dto';
import { Community } from './community.entity';
import { ApiResponse } from 'src/model/apiresponse.model';

@ApiTags('Community')
@Controller('api/community')
export class CommunityController {
    constructor(private readonly commService: CommunityService) {}

    @Get('dashboard')
    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin', 'CommunityAdmin'] })
    async dashboard(@Request() req): Promise<ApiResponse<CommDashboardDto>> {
        const user = req.user;
        const data = await this.commService.getDashboardForUser(user);
        console.log('Community Dashboard data', data);
        return { result: true, message: 'Community dashboard data fetched successfully', data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin', 'CommunityAdmin'] })
    @Post()
    async create(@Body() dto: CreateCommDto): Promise<ApiResponse<Community>> {
        console.log('Create Community DTO', dto);
        const data = await this.commService.create(dto);
        return { result: true, message: 'Community created', data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin', 'CommunityAdmin'] })
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req): Promise<ApiResponse<CommWithUserDto>> {
        const email = req.user?.email as string;
        const data = await this.commService.findOne(id, email);
        console.log('Get Community', data);
        return { result: true, message: `Fetched Community "${data.commName}"`, data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin', 'CommunityAdmin'] })
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCommDto): Promise<ApiResponse<CommWithUserDto>> {
        console.log(`Updating Community  with ${id}`);
        const data = await this.commService.update(id, dto);
        console.log('Updated Community ', data);
        return { result: true, message: `Community "${data.commName}" updated`, data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin', 'CommunityAdmin'] })
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
        console.log(`Deleting Community  with ${id}`);
        await this.commService.remove(id);
        return {
            result: true,
            data: null,
            message: 'Organization deleted successfully',
        };
    }
}
