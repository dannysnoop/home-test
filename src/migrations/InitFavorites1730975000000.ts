// src/migrations/InitFavorites1730975000000.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitFavorites1730975000000 implements MigrationInterface {
    name = 'InitFavorites1730975000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE favorites (
        user_id CHAR(36) NOT NULL,
        store_id CHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, store_id),
        CONSTRAINT fk_fav_user  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
        CONSTRAINT fk_fav_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        INDEX idx_fav_user (user_id),
        INDEX idx_fav_store (store_id)
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS favorites`);
    }
}
