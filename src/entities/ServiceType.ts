import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'service_types' })
export class ServiceType {
    @PrimaryColumn({ type: 'char', length: 36 })
    id!: string; // UUID string

    @Column({ unique: true, length: 100 })
    name!: string;
}
