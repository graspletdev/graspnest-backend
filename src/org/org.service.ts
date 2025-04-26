// src/org/org.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './org.entity';
import { Community } from 'src/community/community.entity';
import { CreateOrgDto, UpdateOrgDto, OrgDashboardDto, CommDetailsDto } from './org.dto';

@Injectable()
export class OrgService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Community)
        private readonly commRepo: Repository<Community>
    ) {}

    async findAll(): Promise<Organization[]> {
        return this.orgRepo.find();
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
        const org = await this.orgRepo.findOne({
            select: ['id', 'orgName'],
            where: { orgAdminEmail },
        });
        if (!org) {
            throw new NotFoundException(`No organization found for admin: ${orgAdminEmail}`);
        }
        try {
            const [communities, landlords, tenants] = await Promise.all([
                this.commRepo.count({ where: { orgId: org.id } }),
                0,
                0,
                //                 this.lordRepo.count(),
                //                 this.tenantRepo.count(),
            ]);

            const comms = await this.commRepo.find({ where: { orgId: org.id } });
            const orgCommDetails: CommDetailsDto[] = comms.map((o) => ({
                orgId: org.id,
                orgName: org.orgName,
                commName: o.communityName,
                commAdminFirstName: o.communityAdminFirstName,
                commAdminLastName: o.communityAdminLastName,
                communitiesCount: 2,
                landlordsCount: 3,
                tenantsCount: 4,
            }));
            return {
                totals: { communities, landlords, tenants },
                orgCommDetails,
            };
        } catch (error) {
            console.log('Error fetching  Org dashboard data', error.stack || error);
            // Hide internal details, give client a 500
            throw new InternalServerErrorException('Unable to load Org dashboard data');
        }
    }
}
