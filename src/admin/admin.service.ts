// src/admin/admin.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from 'src/org/org.entity';
import { Community } from 'src/community/community.entity';
// import { Landlord } from 'src/landlord/landlord.entity';
// import { Tenant } from 'src/tenant/tenant.entity';
import { DashboardDto, OrgDetailsDto } from './admin.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>
        //     @InjectRepository(Landlord)
        //     private readonly lordRepo: Repository<Landlord>,
        //     @InjectRepository(Tenant)
        //     private readonly tenantRepo: Repository<Tenant>,
    ) {}

    async getDashboard(): Promise<DashboardDto> {
        try {
            // fetch global totals in parallel
            const [organizations, communities, landlords, tenants] = await Promise.all([
                this.orgRepo.count(),
                this.commRepo.count(),
                0,
                0,
                //                 this.lordRepo.count(),
                //                 this.tenantRepo.count(),
            ]);
            const orgs = await this.orgRepo.find();
            const adminOrgDetails: OrgDetailsDto[] = orgs.map((o) => ({
                orgId: o.id,
                orgName: o.orgName,
                orgAdminFirstName: o.orgAdminFirstName,
                orgAdminLastName: o.orgAdminLastName,
                communitiesCount: 2,
                landlordsCount: 3,
                tenantsCount: 4,
            }));

            // fetch per‑Org breakdown in one shot
            //             const orgs = await this.orgRepo
            //                 .createQueryBuilder('org')
            //                 .select(['org.id', 'org.orgName'])
            //                 .loadRelationCountAndMap('org.communitiesCount', 'org.communities')
            //                 .loadRelationCountAndMap('org.landlordsCount', 'org.landlords')
            //                 .loadRelationCountAndMap('org.tenantsCount', 'org.tenants')
            //                 .getMany();

            //             const breakdown: OrgBreakdownDto[] = orgs.map((o) => ({
            //                 orgId: o.id,
            //                 orgName: o.orgName,
            //                 communitiesCount: (o as any).communitiesCount,
            //                 landlordsCount: o.landlordsCount,
            //                 tenantsCount: o.tenantsCount,
            //                 landlordsCount: 0,
            //                 tenantsCount: 0,
            //             }));

            return {
                totals: { organizations, communities, landlords, tenants },
                adminOrgDetails,
            };
        } catch (error) {
            console.log('Error fetching dashboard data', error.stack || error);
            // Hide internal details, give client a 500
            throw new InternalServerErrorException('Unable to load dashboard data');
        }
    }
}
