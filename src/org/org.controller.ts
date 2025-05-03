import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    HttpCode,
    UseGuards,
    Request,
    BadRequestException,
    ParseIntPipe,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { OrgService } from './org.service';
import { CreateOrgDto, UpdateOrgDto, OrgDashboardDto, OrgWithUserDto } from './org.dto';
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

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Post()
    async create(@Body() dto: CreateOrgDto): Promise<ApiResponse<Organization>> {
        console.log('Create Org DTO', dto);
        const data = await this.orgService.create(dto);
        return { result: true, message: 'Organization created', data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req): Promise<ApiResponse<OrgWithUserDto>> {
        const email = req.user?.email as string;
        const data = await this.orgService.findOne(id, email);
        console.log('Get Org', data);
        return { result: true, message: `Fetched organization "${data.orgName}"`, data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateOrgDto): Promise<ApiResponse<OrgWithUserDto>> {
        console.log('From Update Org ', id);
        const data = await this.orgService.update(id, dto);
        console.log('Update Org ', data);
        return { result: true, message: `Organization "${data.orgName}" updated`, data };
    }

    @UseGuards(AuthGuard)
    @Roles({ roles: ['SuperAdmin', 'OrgAdmin'] })
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
        console.log('in delete controller');
        await this.orgService.remove(id);
        return {
            result: true,
            data: null,
            message: 'Organization deleted successfully',
        };
    }
}
