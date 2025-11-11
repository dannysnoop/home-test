import { MigrationInterface, QueryRunner } from "typeorm";

export class InitStoresAndServiceTypes1730970000000 implements MigrationInterface {
    name = 'InitStoresAndServiceTypes1730970000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE service_types (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        await queryRunner.query(`
      CREATE TABLE stores (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        service_type_id CHAR(36) NOT NULL,
        address VARCHAR(500),
        lat DECIMAL(10,7) NOT NULL,
        lon DECIMAL(10,7) NOT NULL,
        location POINT NOT NULL SRID 4326,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        SPATIAL INDEX idx_location (location),
        INDEX idx_name (name),
        INDEX idx_service_type (service_type_id),
        CONSTRAINT fk_store_service_type FOREIGN KEY (service_type_id)
          REFERENCES service_types(id) ON DELETE CASCADE
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS stores`);
        await queryRunner.query(`DROP TABLE IF EXISTS service_types`);
    }
}
