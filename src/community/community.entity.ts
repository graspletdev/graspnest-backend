import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Community {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    orgId: number;

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

    //     @OneToMany(() => Community, (community) => community.organization)
    //     communities: Community[];
}
