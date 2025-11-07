import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index('IDX_USER_USERNAME', { unique: true })
    @Column({ type: 'varchar', length: 64 })
    username!: string;

    @Index('IDX_USER_EMAIL', { unique: true })
    @Column({ type: 'varchar', length: 255 })
    email!: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash!: string;

    @Column({ name: 'twofa_secret', type: 'varchar', length: 64, nullable: true })
    twofaSecret?: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;
}
