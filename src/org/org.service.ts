// src/org/org.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './org.entity';
import { Community } from 'src/community/community.entity';
import { Landlord } from 'src/landlord/landlord.entity';
import { CreateOrgDto, UpdateOrgDto, OrgDashboardDto, CommDetailsDto } from './org.dto';
import { In } from 'typeorm';

@Injectable()
export class OrgService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>,
        @InjectRepository(Landlord)
        private readonly landlordRepo: Repository<Landlord>
    ) {}

    async findAll(): Promise<OrgDashboardDto> {
        try {
            const orgs = await this.orgRepo.find({
                select: ['id', 'orgName'],
            });

            const totals = await this.getTotalCounts(); // For all organizations
            const orgCommDetails = await this.formatOrgData(orgs);

            return { totals, orgCommDetails };
        } catch (error) {
            console.error('Error fetching organizations:', error.stack || error);
            throw new InternalServerErrorException('Unable to load organizations data');
        }
    }

    async findOne(orgName: string): Promise<Organization> {
        const org = await this.orgRepo.findOneBy({ orgName });
        if (!org) {
            throw new NotFoundException(`Organization "${orgName}" not found`);
        }
        return org;
    }

    async create(dto: CreateOrgDto): Promise<Organization> {
        const exists = await this.orgRepo.findOneBy({ orgName: dto.orgName });
        if (exists) {
            throw new ConflictException(`Organization "${dto.orgName}" already exists`);
        }
        const org = this.orgRepo.create(dto);
        try {
            return await this.orgRepo.save(org);
        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException('Could not save organization');
        }
    }

    async update(orgName: string, dto: UpdateOrgDto): Promise<Organization> {
        const org = await this.findOne(orgName);
        Object.assign(org, dto);
        try {
            return await this.orgRepo.save(org);
        } catch (err) {
            throw new InternalServerErrorException('Could not update organization');
        }
    }

    async remove(orgName: string): Promise<void> {
        const org = await this.findOne(orgName);
        try {
            await this.orgRepo.remove(org);
        } catch (err) {
            throw new InternalServerErrorException('Could not delete organization');
        }
    }

    async dashboard(orgAdminEmail: string): Promise<OrgDashboardDto> {
        try {
            const org = await this.orgRepo.findOne({
                select: ['id', 'orgName'],
                where: { orgAdminEmail },
            });

            if (!org) {
                throw new NotFoundException(`No organization found for admin: ${orgAdminEmail}`);
            }

            const totals = await this.getTotalCounts(org.id);
            const orgCommDetails = await this.formatOrgData([org]);

            return { totals, orgCommDetails };
        } catch (error) {
            console.error('Error fetching Org dashboard data:', error.stack || error);
            throw new InternalServerErrorException('Unable to load Org dashboard data');
        }
    }

    private async getTotalCounts(orgId?: number): Promise<OrgDashboardDto['totals']> {
        try {
            const whereClause = orgId ? { organization: { id: orgId } } : {};

            // Fetch communities (only IDs)
            const communitiesList = await this.commRepo.find({
                select: ['id'],
                where: whereClause,
            });

            const communityIds = communitiesList.map((c) => c.id);

            let landlordsCount = 0;

            if (communityIds.length > 0) {
                landlordsCount = await this.landlordRepo.count({
                    where: {
                        community: {
                            id: In(communityIds), // Single optimized query!
                        },
                    },
                });
            }

            const communitiesCount = await this.commRepo.count({ where: whereClause });

            const tenantsCount = 0; // placeholder for now

            return {
                communities: communitiesCount,
                landlords: landlordsCount,
                tenants: tenantsCount,
            };
        } catch (error) {
            console.error('Error fetching totals:', error.stack || error);
            throw new InternalServerErrorException('Unable to fetch totals');
        }
    }

    private async formatOrgData(orgs: Organization[]): Promise<CommDetailsDto[]> {
        const result: CommDetailsDto[] = [];

        if (orgs.length === 0) {
            return result;
        }

        const orgIds = orgs.map((org) => org.id);

        // Fetch all communities for these organizations
        const communities = await this.commRepo.find({
            where: {
                organization: { id: In(orgIds) },
            },
            relations: ['organization'], // Optional, if we need extra org data
        });

        // Fetch all landlords for these communities
        const communityIds = communities.map((comm) => comm.id);
        let landlords = [];

        if (communityIds.length > 0) {
            landlords = await this.landlordRepo.find({
                select: ['id', 'landLordFirstName', 'landLordLastName', 'community'],
                where: {
                    community: { id: In(communityIds) },
                },
                relations: ['community'],
            });
        }

        // Group communities by orgId
        const communitiesByOrg = new Map<number, Community[]>();
        for (const community of communities) {
            const orgId = community.organization.id;
            if (!communitiesByOrg.has(orgId)) {
                communitiesByOrg.set(orgId, []);
            }
            communitiesByOrg.get(orgId)!.push(community);
        }

        // Group landlords by communityId
        const landlordsByCommunity = new Map<number, number>();
        for (const landlord of landlords) {
            const commId = landlord.community.id;
            landlordsByCommunity.set(commId, (landlordsByCommunity.get(commId) || 0) + 1);
        }

        //  Build the result per organization
        for (const org of orgs) {
            const orgCommunities = communitiesByOrg.get(org.id) || [];

            if (orgCommunities.length > 0) {
                for (const comm of orgCommunities) {
                    const landlordsCount = landlordsByCommunity.get(comm.id) || 0;

                    result.push({
                        orgId: org.id,
                        orgName: org.orgName,
                        commName: comm.communityName,
                        commAdminFirstName: comm.communityAdminFirstName,
                        commAdminLastName: comm.communityAdminLastName,
                        communitiesCount: orgCommunities.length,
                        landlordsCount: landlordsCount,
                        tenantsCount: 0, // Can add similar logic for tenants
                    });
                }
            }
            //             else {
            //                 // Organization with no communities
            //                 result.push({
            //                     orgId: org.id,
            //                     orgName: org.orgName,
            //                     commName: '',
            //                     commAdminFirstName: '',
            //                     commAdminLastName: '',
            //                     communitiesCount: 0,
            //                     landlordsCount: 0,
            //                     tenantsCount: 0,
            //                 });
            //             }
        }

        return result;
    }
}
