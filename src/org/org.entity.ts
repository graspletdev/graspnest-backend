import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Community } from 'src/community/community.entity';

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

    // one Organization has many Community
    @OneToMany(() => Community, (comm) => comm.organization)
    communities: Community[];
}
