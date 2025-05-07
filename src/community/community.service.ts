import {
    Injectable,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    HttpException,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Community } from './community.entity';
import { CreateCommDto, UpdateCommDto, CommDashboardDto, landlordDetailsDto, CommWithUserDto } from './community.dto';
import { Landlord } from 'src/landlord/landlord.entity';
import { Organization } from 'src/org/org.entity';
import { User } from 'src/user/user.entity';
import { In } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class CommunityService {
    private clientId: string;
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>,
        @InjectRepository(Landlord)
        private readonly landlordRepo: Repository<Landlord>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private userService: UserService,
        private readonly authService: AuthService,
        private readonly dataSource: DataSource
    ) {
        this.clientId = process.env.KEYCLOAK_CLIENT_ID;
    }

    async create(dto: CreateCommDto): Promise<Community> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const existing = await queryRunner.manager.findOne(Community, {
                where: { commName: dto.commName },
            });

            if (existing) {
                throw new ConflictException(`Community "${dto.commName}" already exists.`);
            }

            const {
                orgName,
                commAdminEmail: adminEmail,
                commAdminFirst: adminFirst,
                commAdminLast: adminLast,
                commAdminContact: adminContact,
                ...commFields
            } = dto;

            const userReg = await this.authService.register({
                username: adminEmail,
                firstName: adminFirst,
                lastName: adminLast,
                contact: adminContact,
                role: 'CommunityAdmin',
            });

            if (!userReg?.result || !userReg?.data?.userId) {
                throw new InternalServerErrorException(userReg?.message || 'Community admin registration failed.');
            }

            const adminUser = await queryRunner.manager.findOne(User, {
                where: { username: userReg.data.userId },
            });

            if (!adminUser) {
                throw new InternalServerErrorException('Community admin created in Auth system but not found in DB.');
            }

            const org = await queryRunner.manager.findOne(Organization, {
                where: { orgName: orgName, active: true },
            });

            if (!org) {
                throw new NotFoundException(`Organization "${orgName}" not found or inactive.`);
            }

            const newCommunity = queryRunner.manager.create(Community, {
                ...commFields,
                organization: org,
                active: true,
                communityUsers: [adminUser],
            });

            const savedCommunity = await queryRunner.manager.save(Community, newCommunity);

            adminUser.community = savedCommunity;
            adminUser.organization = org;

            await queryRunner.manager.save(User, adminUser);

            await queryRunner.commitTransaction();
            return savedCommunity;
        } catch (err) {
            await queryRunner.rollbackTransaction();

            if (err instanceof HttpException) throw err;

            console.error('Transaction failed creating community:', err);
            throw new InternalServerErrorException('An unexpected error occurred while creating the community.');
        } finally {
            await queryRunner.release();
        }
    }

    async update(commId: string, dto: UpdateCommDto): Promise<CommWithUserDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const commRepo = queryRunner.manager.getRepository(Community);
            const userRepo = queryRunner.manager.getRepository(User);

            const comm = await commRepo.findOne({
                where: { id: commId, active: true },
                relations: ['communityUsers', 'organization'],
            });

            if (!comm) {
                throw new NotFoundException(`Community with ID "${commId}" not found`);
            }

            const { orgName, commAdminFirst, commAdminLast, commAdminEmail, commAdminContact, ...commFields } = dto;

            const currentUser = comm.communityUsers.find((u) => u.email === commAdminEmail);
            console.log('currentUser', currentUser);
            if (!currentUser) {
                throw new NotFoundException(`Admin user with email "${commAdminEmail}" not found in community`);
            }

            await commRepo.update(commId, commFields);
            await userRepo.update(currentUser.id, {
                firstName: commAdminFirst,
                lastName: commAdminLast,
                contact: commAdminContact,
            });

            await queryRunner.commitTransaction();

            const updatedComm = await this.commRepo.findOne({
                where: { id: commId, active: true },
                relations: ['communityUsers', 'organization'],
            });
            //console.log("updatedComm",updatedComm)
            const updatedUser = updatedComm.communityUsers.find((u) => u.id === currentUser.id);
            //console.log("updatedUser",updatedUser)
            return {
                commName: updatedComm.commName,
                commType: updatedComm.commType,
                blockNum: updatedComm.blockNum,
                unitsinBlock: updatedComm.unitsinBlock,
                commAddress: updatedComm.commAddress,
                commCity: updatedComm.commCity,
                commState: updatedComm.commState,
                commCountry: updatedComm.commCountry,
                commAdminFirst: updatedUser.firstName,
                commAdminLast: updatedUser.lastName,
                commAdminEmail: updatedUser.email,
                commAdminContact: updatedUser.contact,
                orgName: updatedComm.organization?.orgName,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Failed to update community and user:', error);
            throw new InternalServerErrorException('Update operation failed');
        } finally {
            await queryRunner.release();
        }
    }

    async findOne(commId: string, email: string): Promise<CommWithUserDto> {
        try {
            console.log('commId', commId);
            const community = await this.commRepo
                .createQueryBuilder('community')
                .leftJoinAndSelect('community.communityUsers', 'user')
                .leftJoinAndSelect('community.organization', 'organization')
                .where('community.id = :id', { id: commId })
                .andWhere('community.active = true')
                .getOne();

            if (!community) {
                console.error(`Community with ID "${commId}" not found or inactive.`);
                throw new NotFoundException(`Community "${commId}" not found`);
            }

            const adminUser = community.communityUsers.find((u) => u.role === 'CommunityAdmin');
            if (!adminUser) {
                console.warn(`No CommunityAdmin user found for community "${commId}"`);
                throw new NotFoundException(`Community admin not found for community "${commId}"`);
            }

            return {
                commName: community.commName,
                commType: community.commType,
                blockNum: community.blockNum,
                unitsinBlock: community.unitsinBlock,
                commAddress: community.commAddress,
                commCity: community.commCity,
                commState: community.commState,
                commCountry: community.commCountry,
                commAdminFirst: adminUser.firstName,
                commAdminLast: adminUser.lastName,
                commAdminEmail: adminUser.email,
                commAdminContact: adminUser.contact,
                orgName: community.organization?.orgName ?? '',
            };
        } catch (err) {
            console.error('Error fetching community:', err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException('Could not fetch community details');
        }
    }

    async getDashboardForUser(user: any): Promise<CommDashboardDto> {
        const email = user?.email;
        const roles = (user?.resource_access?.[this.clientId]?.roles as string[]) || [];

        if (!roles.length || !email) {
            throw new UnauthorizedException('User roles or email are missing from the token.');
        }

        try {
            if (roles.includes('SuperAdmin')) {
                return await this.getAllDashboard();
            }

            if (roles.includes('OrgAdmin') || roles.includes('CommunityAdmin')) {
                return await this.getDashboardByEmail(email);
            }

            throw new ForbiddenException('User does not have permission to access the dashboard.');
        } catch (error) {
            console.error('Dashboard access error:', error.stack || error);
            throw new InternalServerErrorException('Failed to load dashboard data.');
        }
    }

    async getAllDashboard(): Promise<CommDashboardDto> {
        try {
            const totals = await this.getTotalCounts();
            const commlandlordDetails = await this.formatOrgData();
            return { totals, commlandlordDetails };
        } catch (error) {
            console.error('getAllDashboard error:', error.stack || error);
            throw new InternalServerErrorException('Unable to load global dashboard data.');
        }
    }

    async getDashboardByEmail(email: string): Promise<CommDashboardDto> {
        try {
            const user = await this.userService.findOneByEmail(email);
            if (!user) throw new NotFoundException(`User with email "${email}" not found.`);

            const org = await this.orgRepo.findOne({
                select: ['id', 'orgName'],
                where: { orgUsers: { id: user.id } },
                relations: ['orgUsers'],
            });

            let comm = null;

            if (!org) {
                comm = await this.commRepo.findOne({
                    select: ['id', 'commName'],
                    where: { communityUsers: { id: user.id } },
                    relations: ['communityUsers'],
                });
            }

            if (!org && !comm) {
                throw new NotFoundException(`No organization or community found for user "${email}".`);
            }

            const totals = await this.getTotalCounts(org?.id, comm?.id);
            const commlandlordDetails = await this.formatOrgData(org, comm);

            return { totals, commlandlordDetails };
        } catch (error) {
            console.error('getDashboardByEmail error:', error.stack || error);
            throw new InternalServerErrorException('Unable to load user-specific dashboard.');
        }
    }

    private async getTotalCounts(orgId?: string, commId?: string): Promise<CommDashboardDto['totals']> {
        try {
            let whereClause = {};

            if (commId) {
                whereClause = { id: commId };
            } else if (orgId) {
                whereClause = { organization: { id: orgId } };
            }

            const communitiesList = await this.commRepo.find({
                select: ['id'],
                where: whereClause,
            });

            const communityIds = communitiesList.map((c) => c.id);

            if (communityIds.length === 0) {
                return {
                    landlords: 0,
                    tenants: 0,
                    unitsCount: 0,
                    blocksCount: 0,
                };
            }

            const landlordsCount = await this.landlordRepo.count({
                where: { community: { id: In(communityIds) } },
            });

            const blockUnitSums = await this.commRepo
                .createQueryBuilder('community')
                .select('SUM(community.blockNum)', 'blocksCount')
                .addSelect('SUM(community.unitsinBlock)', 'totalUnitsinBlock')
                .where('community.id IN (:...ids)', { ids: communityIds })
                .getRawOne();
            console.log('blockUnitSums', blockUnitSums);
            const blocksCount = Number(blockUnitSums?.blocksCount) || 0;
            const totalUnitsinBlock = Number(blockUnitSums?.totalUnitsinBlock) || 0;

            const tenantsCount = 0; // Placeholder

            return {
                landlords: landlordsCount,
                tenants: tenantsCount,
                unitsCount: totalUnitsinBlock,
                blocksCount: blocksCount,
            };
        } catch (error) {
            console.error('Error in getTotalCounts:', error.stack || error);
            throw new InternalServerErrorException('Unable to fetch totals.');
        }
    }

    private async formatOrgData(org?: Organization, comm?: Community): Promise<landlordDetailsDto[]> {
        const result: landlordDetailsDto[] = [];

        let communities: Community[] = [];

        if (org) {
            communities = await this.commRepo.find({
                where: { organization: { id: org.id } },
            });
        } else if (comm) {
            communities = [comm];
        } else {
            communities = await this.commRepo.find();
        }

        const communityIds = communities.map((c) => c.id);

        let landlords: Landlord[] = [];

        if (communityIds.length > 0) {
            landlords = await this.landlordRepo.find({
                select: ['id', 'landLordFirstName', 'landLordLastName', 'blockName'],
                where: {
                    community: { id: In(communityIds) },
                },
                relations: ['community'],
            });
        }

        const landlordsByCommunity = new Map<string, Landlord[]>();

        landlords.forEach((landlord) => {
            const commId = landlord?.community?.id;
            if (!commId) return;

            if (!landlordsByCommunity.has(commId)) {
                landlordsByCommunity.set(commId, []);
            }
            landlordsByCommunity.get(commId)!.push(landlord);
        });

        for (const community of communities) {
            const communityLandlords = landlordsByCommunity.get(community.id) || [];

            for (const landlord of communityLandlords) {
                result.push({
                    commId: community.id,
                    commName: community.commName,
                    blockName: landlord.blockName || '',
                    landlordFirstName: landlord.landLordFirstName,
                    landlordLastName: landlord.landLordLastName,
                    unitsCount: community.unitsinBlock || 0,
                    blocksCount: community.blockNum || 0,
                    landlordsCount: communityLandlords.length,
                    tenantsCount: 0, // placeholder
                });
            }
        }

        return result;
    }

    async remove(commId: string): Promise<void> {
        try {
            const comm = await this.commRepo.findOne({ where: { id: commId } });
            const result = await this.commRepo.update(commId, { active: false });
            console.log('in delete service');
            if (result.affected === 0) throw new NotFoundException();
        } catch (err) {
            console.error(`Could not delete community ${commId}`);
            throw new InternalServerErrorException('Could not delete community');
        }
    }
}
