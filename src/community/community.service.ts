import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './community.entity';
import { CreateCommDto, UpdateCommDto, CommDashboardDto, landlordDetailsDto } from './community.dto';
import { Landlord } from 'src/landlord/landlord.entity';
import { Organization } from 'src/org/org.entity';
import { In } from 'typeorm';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CommunityService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>,
        @InjectRepository(Landlord)
        private readonly landlordRepo: Repository<Landlord>,
        private userService: UserService
    ) {}

    async findAll(): Promise<Community[]> {
        return this.commRepo.find();
    }

    async findOne(commName: string): Promise<Community> {
        const community = await this.commRepo.findOneBy({ communityName: commName });
        if (!community) {
            throw new NotFoundException(`Community "${commName}" not found`);
        }
        return community;
    }

    async create(dto: CreateCommDto): Promise<Community> {
        const exists = await this.commRepo.findOneBy({ communityName: dto.communityName });
        if (exists) {
            throw new ConflictException(`Community "${dto.communityName}" already exists`);
        }
        const community = this.commRepo.create(dto);
        try {
            return await this.commRepo.save(community);
        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException('Could not save community');
        }
    }

    async update(communityName: string, dto: UpdateCommDto): Promise<Community> {
        const community = await this.findOne(communityName);
        Object.assign(community, dto);
        try {
            return await this.commRepo.save(community);
        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException('Could not update community');
        }
    }

    async remove(communityName: string): Promise<void> {
        const community = await this.findOne(communityName);
        try {
            await this.commRepo.remove(community);
        } catch (err) {
            throw new InternalServerErrorException('Could not delete community');
        }
    }

    async getDashboardForUser(user: any): Promise<CommDashboardDto> {
        try {
            const roles = (user?.resource_access?.GraspNestClient?.roles as string[]) || [];
            const email = user?.email as string;

            if (!roles.length) {
                throw new Error('User roles not found in token.');
            }

            if (roles.includes('SuperAdmin')) {
                const { totals, commlandlordDetails } = await this.getAllDashboard();
                return { totals, commlandlordDetails };
            }

            if (roles.includes('OrgAdmin') || roles.includes('CommunityAdmin')) {
                const { totals, commlandlordDetails } = await this.getDashboardByEmail(email);
                return { totals, commlandlordDetails };
            }

            throw new Error('Unauthorized role.');
        } catch (error) {
            console.error('Error in getDashboardForUser:', error.stack || error);
            throw new InternalServerErrorException('Unable to load user dashboard.');
        }
    }

    async getAllDashboard(): Promise<CommDashboardDto> {
        try {
            const totals = await this.getTotalCounts();
            const commlandlordDetails = await this.formatOrgData();
            return { totals, commlandlordDetails };
        } catch (error) {
            console.error('Error in getAllDashboard:', error.stack || error);
            throw new InternalServerErrorException('Unable to load all dashboard data.');
        }
    }

    async getDashboardByEmail(email: string): Promise<CommDashboardDto> {
        try {
            const user = await this.userService.findOneByEmail(email);
            if (!user) throw new NotFoundException(`No user for ${email}`);

            const org = await this.orgRepo.findOne({
              select: ['id', 'orgName'],
              where: { orgUser: { id: user.id } },
              relations: ['orgUser'],     // so TypeORM knows how to traverse the relation
            });


            let comm = null;

            if (!org) {
                comm = await this.commRepo.findOne({
                    select: ['id', 'communityName'],
                    where: { communityAdminEmail: email },
                });
            }

            if (!org && !comm) {
                throw new NotFoundException(`No organization or community found for admin: ${email}`);
            }

            const totals = await this.getTotalCounts(org?.id, comm?.id);
            const commlandlordDetails = await this.formatOrgData(org, comm);
            return { totals, commlandlordDetails };
        } catch (error) {
            console.error('Error in getDashboardByEmail:', error.stack || error);
            throw new InternalServerErrorException('Unable to load dashboard for user.');
        }
    }

    private async getTotalCounts(orgId?: number, commId?: number): Promise<CommDashboardDto['totals']> {
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

            let landlordsCount = 0;
            let blocksCount = 0;
            let totalUnitsinBlock = 0;
            if (communityIds.length > 0) {
                landlordsCount = await this.landlordRepo.count({
                    where: { community: { id: In(communityIds) } },
                });
            }

            const blockUnitSums = await this.commRepo
                .createQueryBuilder('community')
                .select('SUM(community.communityBlocks)', 'blocksCount')
                .addSelect('SUM(community.communityUnitsinBlock)', 'totalUnitsinBlock')
                .where('community.id IN (:...ids)', { ids: communityIds })
                .getRawOne();

            blocksCount = Number(blockUnitSums?.blocksCount) || 0;
            totalUnitsinBlock = Number(blockUnitSums?.totalUnitsinBlock) || 0;

            const tenantsCount = 0; // Future placeholder

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

        let landlords = [];

        if (communityIds.length > 0) {
            landlords = await this.landlordRepo.find({
                select: ['id', 'landLordFirstName', 'landLordLastName', 'blockName', 'community'],
                where: {
                    community: { id: In(communityIds) },
                },
                relations: ['community'],
            });
        }

        // Group landlords by communityId
        const landlordsByCommunity = new Map<number, Landlord[]>();

        landlords.forEach((landlord) => {
            const commId = landlord.community.id;
            if (!landlordsByCommunity.has(commId)) {
                landlordsByCommunity.set(commId, []);
            }
            landlordsByCommunity.get(commId)!.push(landlord);
        });

        // For each community, create a record per landlord
        for (const community of communities) {
            const communityLandlords = landlordsByCommunity.get(community.id) || [];

            for (const landlord of communityLandlords) {
                result.push({
                    commId: community.id,
                    commName: community.communityName,
                    blockName: landlord.blockName || '', // from landlord
                    landlordFirstName: landlord.landLordFirstName,
                    landlordLastName: landlord.landLordLastName,
                    unitsCount: community.communityUnitsinBlock || 0, // from community
                    blocksCount: community.communityBlocks || 0, // from community
                    landlordsCount: communityLandlords.length, // total landlords for this community
                    tenantsCount: 0, // placeholder
                });
            }
        }

        return result;
    }
}
