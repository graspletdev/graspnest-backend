import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './community.entity';
import { CreateCommDto, UpdateCommDto } from './community.dto';

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
}
