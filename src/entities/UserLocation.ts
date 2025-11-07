import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'user_locations' })
@Index(['userId', 'createdAt'])
export class UserLocation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    lat!: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    lon!: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;
}
