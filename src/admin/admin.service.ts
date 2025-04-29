// src/admin/admin.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from 'src/org/org.entity';
import { Community } from 'src/community/community.entity';
import { Landlord } from 'src/landlord/landlord.entity';
// import { Tenant } from 'src/tenant/tenant.entity';
import { DashboardDto, OrgDetailsDto } from './admin.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>,
        @InjectRepository(Landlord)
        private readonly landlordRepo: Repository<Landlord>
        //     @InjectRepository(Tenant)
        //     private readonly tenantRepo: Repository<Tenant>,
    ) {}

    async getDashboard(): Promise<DashboardDto> {
        try {
            // fetch global totals
            const [organizations, communities, landlords, tenants] = await Promise.all([
                this.orgRepo.count(),
                this.commRepo.count(),
                this.landlordRepo.count(),
                0,
                //this.tenantRepo.count(),
            ]);
            //             const orgs = await this.orgRepo.find(); // get all organizations
            //
            //             const adminOrgDetails: OrgDetailsDto[] = [];
            //
            //             for (const org of orgs) {
            //                 const [communities, orgCommunitiesCount] = await this.commRepo.findAndCount({
            //                     where: { organization: { id: org.id } },
            //                 });
            //
            //                 // Get all landlord counts in parallel for communities under this org
            //                 let commLandlordsCount = 0;
            //
            //                 if (communities.length > 0) {
            //                     const landlordCountPromises = communities.map((community) => this.landlordRepo.count({ where: { community: { id: community.id } } }));
            //
            //                     const landlordsCounts = await Promise.all(landlordCountPromises);
            //
            //                     commLandlordsCount = landlordsCounts.reduce((sum, count) => sum + count, 0);
            //                 }
            //
            //                 adminOrgDetails.push({
            //                     orgId: org.id,
            //                     orgName: org.orgName,
            //                     orgAdminFirstName: org.orgAdminFirstName,
            //                     orgAdminLastName: org.orgAdminLastName,
            //                     communitiesCount: orgCommunitiesCount,
            //                     landlordsCount: commLandlordsCount,
            //                     tenantsCount: 0, // Add tenants counting later
            //                 });
            //             }
            const rawData = await this.orgRepo
                .createQueryBuilder('org')
                .leftJoin('org.communities', 'comm')
                .leftJoin('comm.landlords', 'landlord')
                .select('org.id', 'orgId')
                .addSelect('org.orgName', 'orgName')
                .addSelect('org.orgAdminFirstName', 'orgAdminFirstName')
                .addSelect('org.orgAdminLastName', 'orgAdminLastName')
                .addSelect('COUNT(DISTINCT comm.id)', 'communitiesCount')
                .addSelect('COUNT(DISTINCT landlord.id)', 'landlordsCount')
                // .leftJoin('comm.tenants', 'tenant') // later if needed
                // .addSelect('COUNT(DISTINCT tenant.id)', 'tenantsCount')
                .groupBy('org.id')
                .addGroupBy('org.orgName')
                .addGroupBy('org.orgAdminFirstName')
                .addGroupBy('org.orgAdminLastName')
                .getRawMany();

            // Format raw result into OrgDetailsDto[]
            const adminOrgDetails: OrgDetailsDto[] = rawData.map((row) => ({
                orgId: row.orgId,
                orgName: row.orgName,
                orgAdminFirstName: row.orgAdminFirstName,
                orgAdminLastName: row.orgAdminLastName,
                communitiesCount: Number(row.communitiesCount),
                landlordsCount: Number(row.landlordsCount),
                tenantsCount: 0,
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
