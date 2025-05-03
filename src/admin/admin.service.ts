// src/admin/admin.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Organization } from 'src/org/org.entity';
import { Community } from 'src/community/community.entity';
import { Landlord } from 'src/landlord/landlord.entity';
// import { Tenant } from 'src/tenant/tenant.entity';
import { DashboardDto, OrgDetailsDto } from './admin.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
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
                this.orgRepo.count({ where: { active: true } }),
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
            // in your OrgService (or wherever you need this)
            const rawData = await this.orgRepo
                .createQueryBuilder('org')
                // join the one-to-one User relation
                .leftJoin('org.orgUsers', 'admin')
                // join communities & landlords
                .leftJoin('org.communities', 'comm')
                .leftJoin('comm.landlords', 'landlord')
                .where('org.active = :active', { active: true })
                .select('org.id', 'orgId')
                .addSelect('org.orgName', 'orgName')
                // now select the admin’s fields from the user table
                .addSelect('admin.firstName', 'orgAdminFirstName')
                .addSelect('admin.lastName', 'orgAdminLastName')
                .addSelect('COUNT(DISTINCT comm.id)', 'communitiesCount')
                .addSelect('COUNT(DISTINCT landlord.id)', 'landlordsCount')
                .groupBy('org.id')
                .addGroupBy('org.orgName')
                // and group by your joined fields
                .addGroupBy('admin.firstName')
                .addGroupBy('admin.lastName')
                .getRawMany();

            // map to your DTO
            const adminOrgDetails: OrgDetailsDto[] = rawData.map((row) => ({
                orgId: row.orgId,
                orgName: row.orgName,
                orgAdminFirstName: row.orgAdminFirstName,
                orgAdminLastName: row.orgAdminLastName,
                communitiesCount: Number(row.communitiesCount),
                landlordsCount: Number(row.landlordsCount),
                tenantsCount: 0, // populate if/when you join tenants
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
