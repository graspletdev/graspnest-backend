import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Organization } from 'src/org/org.entity';
import { Community } from 'src/community/community.entity';
import { Landlord } from 'src/landlord/landlord.entity';
// import { Tenant } from 'src/tenant/tenant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';

@Module({
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
    imports: [
        TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([Organization]),
        TypeOrmModule.forFeature([Community]),
        TypeOrmModule.forFeature([Landlord]),
        //             TypeOrmModule.forFeature([Tenant]),
    ],
})
export class AdminModule {
    constructor() {}

    async onModuleInit() {
        console.log('AdminModule initialized');
    }
}
