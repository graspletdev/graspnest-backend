import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, ManyToOne } from 'typeorm';
import { Organization } from 'src/org/org.entity';
import { Community } from 'src/community/community.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    role: string;

    @Column({ nullable: true })
    contact: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => Organization, (org) => org.orgUsers)
    organization: Organization;

    @ManyToOne(() => Community, (community) => community.communityUsers)
    community: Community;
}
