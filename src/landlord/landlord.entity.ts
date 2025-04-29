import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { Community } from 'src/community/community.entity';

@Entity()
export class Landlord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    blockName: string;

    @Column()
    landLordFirstName: string;

    @Column()
    landLordLastName: string;

    @Column()
    landLordEmail: string;

    @Column()
    landLordContact: string;

    @ManyToOne(() => Community, (community) => community.landlords)
    community: Community;
}
