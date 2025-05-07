import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from 'src/org/org.entity';
import { Landlord } from 'src/landlord/landlord.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class Community {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    commName: string;

    @Column()
    commType: string;

    @Column()
    blockNum: number;

    @Column()
    unitsinBlock: number;

    @Column({
        type: 'varchar',
        length: 255,
    })
    commAddress: string;

    @Column()
    commCity: string;

    @Column()
    commState: string;

    @Column()
    commCountry: string;

    @Column({ default: true })
    active: boolean;

    //     @Column()
    //     orgId: string;

    // One Community can have many users
    @OneToMany(() => User, (user) => user.community, { cascade: true })
    communityUsers: User[];

    // One Organization can have many communities
    @ManyToOne(() => Organization, (org) => org.communities)
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    // one Community has many Landlords
    @OneToMany(() => Landlord, (landlord) => landlord.community)
    landlords: Landlord[];
}
