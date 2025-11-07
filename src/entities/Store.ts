import {
    Entity, PrimaryColumn, Column, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { ServiceType } from './ServiceType';

@Entity({ name: 'stores' })
export class Store {
    @PrimaryColumn({ type: 'char', length: 36 })
    id!: string; // UUID string

    @Column({ length: 255 })
    name!: string;

    @Column({ name: 'service_type_id', type: 'char', length: 36 })
    serviceTypeId!: string;

    @ManyToOne(() => ServiceType)
    @JoinColumn({ name: 'service_type_id' })
    serviceType!: ServiceType;

    @Column({ type: 'varchar', length: 500, nullable: true })
    address!: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    lat!: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    lon!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
