import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { Organization } from 'src/org/org.entity';

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

    @OneToOne(() => Organization, (org) => org.orgUser)
    organization: Organization;
}
