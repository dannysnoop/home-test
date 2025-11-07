// src/entities/Favorite.ts
import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Store } from './Store';

@Entity({ name: 'favorites' })
export class Favorite {
    @PrimaryColumn({ name: 'user_id', type: 'char', length: 36 })
    userId!: string; // UUID

    @PrimaryColumn({ name: 'store_id', type: 'char', length: 36 })
    storeId!: string; // UUID

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Store, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'store_id' })
    store!: Store;
}
