import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { Organization } from 'src/org/org.entity';
import { Landlord } from 'src/landlord/landlord.entity';

@Entity()
export class Community {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    communityName: string;

    @Column()
    communityType: string;

    @Column()
    communityBlocks: number;

    @Column()
    communityUnitsinBlock: number;

    @Column({
        type: 'varchar',
        length: 255,
    })
    communityAddress: string;

    @Column()
    communityPostCode: string;

    @Column()
    communityCity: string;

    @Column()
    communityState: string;

    @Column()
    communityCountry: string;

    @Column()
    communityAdminFirstName: string;

    @Column()
    communityAdminLastName: string;

    @Column()
    communityAdminEmail: string;

    @Column()
    communityAdminContact: string;

    @Column({
        type: 'varchar',
        length: 255,
    })
    communityFeatures: string;

    @ManyToOne(() => Organization, (org) => org.communities)
    organization: Organization;

    // one Community has many Landlords
    @OneToMany(() => Landlord, (landlord) => landlord.community)
    landlords: Landlord[];
}
