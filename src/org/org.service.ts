// src/org/org.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Organization } from './org.entity';
import { Community } from 'src/community/community.entity';
import { Landlord } from 'src/landlord/landlord.entity';
import { User } from 'src/user/user.entity';
import { CreateOrgDto, UpdateOrgDto, OrgDashboardDto, CommDetailsDto, OrgWithUserDto } from './org.dto';
import { In } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { RegisterResponse } from 'src/model/authresponse.model';
import { ApiResponse } from 'src/model/apiresponse.model';

@Injectable()
export class OrgService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>,
        @InjectRepository(Landlord)
        private readonly landlordRepo: Repository<Landlord>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly connection: Connection
    ) {}

    async findAll(): Promise<OrgDashboardDto> {
        try {
            const orgs = await this.orgRepo.find({
                select: ['id', 'orgName'],
                where: { active: true },
            });

            const totals = await this.getTotalCounts(); // For all organizations
            const orgCommDetails = await this.formatOrgData(orgs);

            return { totals, orgCommDetails };
        } catch (error) {
            console.error('Error fetching organizations:', error.stack || error);
            throw new InternalServerErrorException('Unable to load organizations data');
        }
    }

    async findOne(orgId: string): Promise<OrgWithUserDto> {
        const org = await this.orgRepo
            .createQueryBuilder('org')
            .leftJoinAndSelect('org.orgUser', 'user')
            .where('org.id = :id', { id: Number(orgId) })
            .andWhere('org.active = true')
            .getOne();
        console.log('Org FindOne', org);
        if (!org) {
            throw new NotFoundException(`Organization "${orgId}" not found`);
        }

        // Map the entity + its related user straight into your DTO
        const dto: OrgWithUserDto = {
            orgName: org.orgName,
            orgType: org.orgType,
            address: org.address,
            city: org.city,
            state: org.state,
            country: org.country,
            regNum: org.regNum,
            vatID: org.vatID,
            website: org.website,
            logo: org.logo,
            docUpload: org.docUpload,
            adminFirst: org.orgUser.firstName,
            adminLast: org.orgUser.lastName,
            adminEmail: org.orgUser.email,
            adminContact: org.orgUser.contact,
        };

        return dto;
    }

    async create(dto: CreateOrgDto): Promise<Organization> {
        const { orgName, adminEmail, adminFirst, adminLast, adminContact, ...orgFields } = dto;

        if (await this.orgRepo.findOne({ where: { orgName, active: true } })) {
            throw new ConflictException(`Organization "${orgName}" already exists`);
        }

        const userReg = await this.authService.register({
            username: adminEmail,
            //email: adminEmail,
            firstName: adminFirst,
            lastName: adminLast,
            contact: adminContact,
            role: 'OrgAdmin',
        });

        if (!userReg.result) {
            throw new InternalServerErrorException(userReg.message || 'Failed to register organization admin user');
        }
        console.log('Registered User ID', userReg.data.userId);
        const newUserId = userReg.data.userId;
        if (!newUserId) {
            throw new InternalServerErrorException('Registration succeeded but no user ID was returned');
        }

        const adminUser = await this.userRepo.findOne({
            where: { username: newUserId },
        });
        if (!adminUser) {
            throw new InternalServerErrorException('Admin user was created in Keycloak but not found in local database');
        }

        try {
            const org = this.orgRepo.create({
                ...orgFields,
                orgName,
                active: true,
                orgUser: adminUser,
            });
            return await this.orgRepo.save(org);
        } catch (err: any) {
            console.error('Failed to save organization', err);
            throw new InternalServerErrorException('Could not create organization record');
        }
    }

    async update(orgId: string, dto: UpdateOrgDto): Promise<OrgWithUserDto> {
        const org = await this.orgRepo.findOne({ where: { id: Number(orgId), active: true }, relations: ['orgUser'] });

        if (!org) throw new NotFoundException(`Org ${orgId} not found`);

        const { adminFirst, adminLast, adminEmail, adminContact, ...orgFields } = dto;

        await this.orgRepo.update(orgId, orgFields);

        //  Update the user row
        console.log('org', org);
        await this.userRepo.update(org.orgUser.id, {
            firstName: adminFirst,
            lastName: adminLast,
            email: adminEmail,
            contact: adminContact,
        });

        const updated = await this.orgRepo.findOne({
            where: { id: Number(orgId), active: true },
            relations: ['orgUser'],
        });
        return {
            orgName: updated.orgName,
            orgType: updated.orgType,
            address: updated.address,
            city: updated.city,
            state: updated.state,
            country: updated.country,
            regNum: updated.regNum,
            vatID: updated.vatID,
            website: updated.website,
            logo: updated.logo,
            docUpload: updated.docUpload,
            adminFirst: updated.orgUser.firstName,
            adminLast: updated.orgUser.lastName,
            adminEmail: updated.orgUser.email,
            adminContact: updated.orgUser.contact,
        };
    }

    //
    //     async remove(orgName: string): Promise<void> {
    //         const org = await this.findOne(orgName);
    //         try {
    //             await this.orgRepo.remove(org);
    //         } catch (err) {
    //             throw new InternalServerErrorException('Could not delete organization');
    //         }
    //     }

    async dashboard(orgAdminEmail: string): Promise<OrgDashboardDto> {
        try {
            const user = await this.userService.findOneByEmail(orgAdminEmail);
            if (!user) throw new NotFoundException(`No user for ${orgAdminEmail}`);

            const org = await this.orgRepo.findOne({
                select: ['id', 'orgName'],
                where: { orgUser: { id: user.id }, active: true },
                relations: ['orgUser'], // so TypeORM knows how to traverse the relation
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
