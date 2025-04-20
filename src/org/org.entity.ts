import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Organization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    orgName: string;

    @Column()
    orgType: string;

    @Column({
        type: 'varchar',
        length: 255,
    })
    orgAddress: string;

    @Column()
    orgPostCode: string;

    @Column()
    orgCity: string;

    @Column()
    orgState: string;

    @Column()
    orgCountry: string;

    @Column()
    orgAdminFirstName: string;

    @Column()
    orgAdminLastName: string;

    @Column()
    orgAdminEmail: string;

    @Column()
    orgAdminContact: string;

    @Column()
    orgLicense: string;

    @Column({
        type: 'varchar',
        length: 255,
    })
    orgBankDetails: string;

    //     @OneToMany(() => Community, (community) => community.organization)
    //     communities: Community[];
}
