import { Module } from '@nestjs/common';
import { Landlord } from './landlord.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Landlord])],
})
export class LandlordModule {}
