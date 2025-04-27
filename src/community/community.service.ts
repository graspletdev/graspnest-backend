import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './community.entity';
import { CreateCommDto, UpdateCommDto, CommDashboardDto, landlordDetailsDto } from './community.dto';

@Injectable()
export class CommunityService {
    constructor(
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>
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

    async dashboard(communityAdminEmail: string): Promise<CommDashboardDto> {
        const comm = await this.commRepo.findOne({
            select: ['id', 'communityName'],
            where: { communityAdminEmail },
        });
        if (!comm) {
            throw new NotFoundException(`No Community found for admin: ${communityAdminEmail}`);
        }
        try {
            const [landlords, tenants] = await Promise.all([
                0, 0,
                //                 this.lordRepo.count(),
                //                 this.tenantRepo.count(),
            ]);

            //             const [landlords, landlordsCount] = await this.lordRepo.findAndCount({
            //               where: { organization: { id: org.id  } },
            //               relations: ['organization'],
            //             });
            const commlandlordDetails: landlordDetailsDto[] = [
                {
                    commId: 1,
                    commName: 'Test Community',
                    landlordFirstName: 'landlordFirstName',
                    landlordLastName: 'landlordFirstName',
                    unitsCount: 4,
                    landlordsCount: 2,
                    tenantsCount: 2,
                },
            ];
            return {
                totals: { landlords, tenants },
                commlandlordDetails,
            };
        } catch (error) {
            console.log('Error fetching  Community dashboard data', error.stack || error);
            // Hide internal details, give client a 500
            throw new InternalServerErrorException('Unable to load Community dashboard data');
        }
    }
}
