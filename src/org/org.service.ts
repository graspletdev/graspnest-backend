// src/org/org.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './org.entity';
import { CreateOrgDto, UpdateOrgDto } from './org.dto';

@Injectable()
export class OrgService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>
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
}
