// src/org/org.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, HttpException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
        private readonly dataSource: DataSource
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

    async findOne(orgId: string, email: string): Promise<OrgWithUserDto> {
        const org = await this.orgRepo
            .createQueryBuilder('org')
            .leftJoinAndSelect('org.orgUsers', 'user')
            .where('org.id = :id', { id: orgId })
            .andWhere('org.active = true')
            .getOne();
        console.log('Org FindOne', org);
        if (!org) {
            console.error(`Organization "${orgId}" not found`);
            throw new NotFoundException(`Organization "${orgId}" not found`);
        }

        // Map the entity + its related user straight into your DTO
        // Org has only one user with role OrgAdmin
        const adminUser = org.orgUsers.find((u) => u.role === 'OrgAdmin');
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
            adminFirst: adminUser.firstName,
            adminLast: adminUser.lastName,
            adminEmail: adminUser.email,
            adminContact: adminUser.contact,
        };

        return dto;
    }

    async create(dto: CreateOrgDto): Promise<Organization> {
        try {
            const { orgName, adminEmail, adminFirst, adminLast, adminContact, ...orgFields } = dto;

            if (!orgName || !adminEmail || !adminFirst || !adminLast) {
                throw new BadRequestException('Missing required fields for organization creation');
            }

            const existingOrg = await this.orgRepo.findOne({ where: { orgName, active: true } });
            if (existingOrg) {
                console.error(`Organization "${orgName}" already exists`);
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
                console.error('Failed to register organization admin user');
                throw new InternalServerErrorException(userReg.message || 'Failed to register organization admin user');
            }
            //prints the user email and assigned to newUserName
            // username is returned from auth Service
            console.log('Registered User ID', userReg.data.userId);
            const newUserName = userReg.data.userId;
            if (!newUserName) {
                console.error(`Registration succeeded but no user ID was returned ${newUserName}`);
                throw new InternalServerErrorException('Registration succeeded but no user ID was returned');
            }

            //             const adminUser = await this.userRepo.findOne({
            //                 where: { username: newUserName },
            //             });
            const adminUser = await this.userService.findOneByEmail(newUserName);
            if (!adminUser) {
                console.error('Admin user was created in Keycloak but not found in local database');
                throw new InternalServerErrorException('Admin user was created in Keycloak but not found in local database');
            }

            const org = this.orgRepo.create({
                ...orgFields,
                orgName,
                active: true,
                orgUsers: [adminUser],
            });
            return await this.orgRepo.save(org);
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }
            console.error('Failed to save organization', err);
            throw new InternalServerErrorException('Could not create organization record');
        }
    }

    async update(orgId: string, dto: UpdateOrgDto): Promise<OrgWithUserDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const orgRepo = queryRunner.manager.getRepository(Organization);
            const userRepo = queryRunner.manager.getRepository(User);

            const org = await orgRepo.findOne({
                where: { id: orgId, active: true },
                relations: ['orgUsers'],
            });

            if (!org) {
                throw new NotFoundException(`Organization with ID "${orgId}" not found`);
            }

            const { adminFirst, adminLast, adminEmail, adminContact, ...orgFields } = dto;
            // get the user of the Email in org row
            const currentUser = org.orgUsers.find((u) => u.email === adminEmail);
            if (!currentUser) {
                throw new NotFoundException(`Admin user with email "${adminEmail}" not found in organization`);
            }

            // Update org - explicitly list updatable fields
            await orgRepo.update(orgId, {
                ...orgFields,
            });

            // Update admin user fields
            await userRepo.update(currentUser.id, {
                firstName: adminFirst,
                lastName: adminLast,
                contact: adminContact,
            });

            await queryRunner.commitTransaction();

            const updatedOrg = await this.orgRepo.findOne({
                where: { id: orgId, active: true },
                relations: ['orgUsers'],
            });

            const updatedUser = updatedOrg.orgUsers.find((u) => u.id === currentUser.id);

            return {
                orgName: updatedOrg.orgName,
                orgType: updatedOrg.orgType,
                address: updatedOrg.address,
                city: updatedOrg.city,
                state: updatedOrg.state,
                country: updatedOrg.country,
                regNum: updatedOrg.regNum,
                vatID: updatedOrg.vatID,
                website: updatedOrg.website,
                logo: updatedOrg.logo,
                docUpload: updatedOrg.docUpload,
                adminFirst: updatedUser.firstName,
                adminLast: updatedUser.lastName,
                adminEmail: updatedUser.email,
                adminContact: updatedUser.contact,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Failed to update organization and user:', error);
            throw new InternalServerErrorException('Update operation failed');
        } finally {
            await queryRunner.release();
        }
    }

    async remove(orgId: string): Promise<void> {
        try {
            const org = await this.orgRepo.findOne({ where: { id: orgId } });
            const result = await this.orgRepo.update(orgId, { active: false });
            console.log('in delete service');
            if (result.affected === 0) throw new NotFoundException();
        } catch (err) {
            console.error(`Could not delete organization ${orgId}`);
            throw new InternalServerErrorException('Could not delete organization');
        }
    }

    async dashboard(orgAdminEmail: string): Promise<OrgDashboardDto> {
        try {
            const user = await this.userService.findOneByEmail(orgAdminEmail);
            if (!user) throw new NotFoundException(`No user for ${orgAdminEmail}`);

            const org = await this.orgRepo.findOne({
                select: ['id', 'orgName'],
                where: { orgUsers: { id: user.id }, active: true },
                relations: ['orgUsers'],
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

    private async getTotalCounts(orgId?: string): Promise<OrgDashboardDto['totals']> {
        try {
            const whereClause = orgId ? { organization: { id: orgId }, active: true } : {};

            // Fetch communities (only IDs) - include community active too
            const communitiesList = await this.commRepo.find({
                select: ['id'],
                where: whereClause,
            });

            const communityIds = communitiesList.map((c) => c.id);
            const communitiesCount = communitiesList.length;

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
            relations: ['organization', 'communityUsers'], // Optional, if we need extra org data
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
        const communitiesByOrg = new Map<string, Community[]>();
        for (const community of communities) {
            const orgId = community.organization.id;
            if (!communitiesByOrg.has(orgId)) {
                communitiesByOrg.set(orgId, []);
            }
            communitiesByOrg.get(orgId)!.push(community);
        }

        // Group landlords by communityId
        const landlordsByCommunity = new Map<string, number>();
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
                    // Find CommunityAdmin
                    const commAdmin = comm.communityUsers?.find((u) => u.role === 'CommunityAdmin');

                    result.push({
                        orgId: org.id,
                        orgName: org.orgName,
                        commId: comm.id,
                        commName: comm.commName,
                        commAdminFirstName: commAdmin?.firstName || '',
                        commAdminLastName: commAdmin?.lastName || '',
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

    async getOrg(roles: string[], email: string): Promise<OrgWithUserDto[]> {
        try {
            const user = await this.userService.findOneByEmail(email);
            if (!user) throw new NotFoundException(`No user for ${email}`);

            if (roles.includes('OrgAdmin')) {
                const org = await this.orgRepo.findOne({
                    where: { orgUsers: { id: user.id }, active: true },
                    relations: ['orgUsers'],
                });

                if (!org) {
                    throw new NotFoundException(`No organization found for user: ${email}`);
                }

                const adminUser = org.orgUsers.find((u) => u.email === email && u.role === 'OrgAdmin');
                if (!adminUser) {
                    throw new NotFoundException(`No OrgAdmin user found for email: ${email}`);
                }

                return [
                    {
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
                        adminFirst: adminUser?.firstName || '',
                        adminLast: adminUser?.lastName || '',
                        adminEmail: adminUser?.email || '',
                        adminContact: adminUser?.contact || '',
                    },
                ];
            }

            if (roles.includes('SuperAdmin')) {
                const orgs = await this.orgRepo.find({
                    where: { active: true },
                    relations: ['orgUsers'],
                });

                return orgs.map((org) => {
                    const adminUser = org.orgUsers.find((u) => u.role === 'OrgAdmin');
                    if (!adminUser) {
                        throw new NotFoundException(`No OrgAdmin user found for email: ${email}`);
                    }

                    return {
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
                        adminFirst: adminUser?.firstName || '',
                        adminLast: adminUser?.lastName || '',
                        adminEmail: adminUser?.email || '',
                        adminContact: adminUser?.contact || '',
                    };
                });
            }

            throw new Error('Unauthorized role.');
        } catch (error) {
            console.error('Error fetching Org data:', error.stack || error);
            throw new InternalServerErrorException('Unable to load Org data');
        }
    }
}
