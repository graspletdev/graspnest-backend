import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: number): Promise<User> {
        return await this.usersRepository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }

    async findOneByUsername(username: string): Promise<User> {
        return await this.usersRepository.findOne({ where: { username } });
    }

    async findOneByEmail(email: string): Promise<User> {
        return await this.usersRepository.findOne({ where: { email: email } });
    }

    async createUser(user: User): Promise<User> {
        return await this.usersRepository.save(user);
    }

    //     async updateUserPassword(username: string, password: string): Promise<User> {
    //         await this.usersRepository.update({ username }, { password });
    //         return await this.usersRepository.findOne({ where: { username } });
    //     }
}
