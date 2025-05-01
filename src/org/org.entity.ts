import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { User } from 'src/user/user.entity';
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
    address: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    country: string;

    @Column()
    regNum: string;

    @Column()
    vatID: string;

    @Column()
    website: string;

    @Column({ nullable: true })
    logo: string;

    @Column({ nullable: true })
    docUpload: string;

    @Column({ default: true })
    active: boolean;

    @OneToOne(() => User, (u) => u.organization, { cascade: true })
    @JoinColumn({ name: 'org_user_id' })
    orgUser: User;

    // one Organization has many Community
    @OneToMany(() => Community, (comm) => comm.organization)
    communities: Community[];
}
