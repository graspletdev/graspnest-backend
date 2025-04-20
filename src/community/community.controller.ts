import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuthGuard } from 'nest-keycloak-connect';
import { CommunityService } from './community.service';
import { CreateCommDto, UpdateCommDto } from './community.dto';
import { Community } from './community.entity';
import { ApiResponse } from 'src/model/apiresponse.model';

@ApiTags('Community')
@Controller('api/community')
export class CommunityController {
    constructor(private readonly commService: CommunityService) {}

    @UseGuards(AuthGuard)
    @Get()
    @SwaggerResponse({ status: 200, description: 'List all Communities', type: Community, isArray: true })
    async findAll(): Promise<ApiResponse<Community[]>> {
        const data = await this.commService.findAll();
        return { result: true, message: 'Fetched Communities', data };
    }

    @UseGuards(AuthGuard)
    @Get(':name')
    @SwaggerResponse({ status: 200, description: 'Get Community by name', type: Community })
    async findOne(@Param('name') name: string): Promise<ApiResponse<Community>> {
        const data = await this.commService.findOne(name);
        return { result: true, message: `Fetched Community "${name}"`, data };
    }

    @UseGuards(AuthGuard)
    @Post()
    @SwaggerResponse({ status: 201, description: 'Create a new community', type: Community })
    async create(@Body() dto: CreateCommDto): Promise<ApiResponse<Community>> {
        const data = await this.commService.create(dto);
        return { result: true, message: 'Community created', data };
    }

    @UseGuards(AuthGuard)
    @Put(':name')
    @SwaggerResponse({ status: 200, description: 'Update existing community', type: Community })
    async update(@Param('name') name: string, @Body() dto: UpdateCommDto): Promise<ApiResponse<Community>> {
        const data = await this.commService.update(name, dto);
        return { result: true, message: `Community "${name}" updated`, data };
    }

    @UseGuards(AuthGuard)
    @Delete(':name')
    @HttpCode(204)
    @SwaggerResponse({ status: 204, description: 'Delete Community' })
    async remove(@Param('name') name: string): Promise<void> {
        await this.commService.remove(name);
    }
}
