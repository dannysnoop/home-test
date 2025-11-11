import { MigrationInterface, QueryRunner } from "typeorm";

export class InitUsers1730900034123 implements MigrationInterface {
    name = 'InitUsers1730900034123';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE users (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        sername VARCHAR(64) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        twofa_secret VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE users`);
    }
}
