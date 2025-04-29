import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DashboardDto } from './admin.dto';
import { AuthGuard, RoleGuard, Roles, Public } from 'nest-keycloak-connect';
import { ApiResponse } from 'src/model/apiresponse.model';

@Controller('api/admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('dashboard')
    @Roles({ roles: ['SuperAdmin'] })
    //    @Public()
    async dashboard(@Request() req): Promise<ApiResponse<DashboardDto>> {
        //console.log(req)
        const data = await this.adminService.getDashboard();
        return {
            result: true,
            message: 'Dashboard data fetched successfully',
            data,
        };
    }
}
