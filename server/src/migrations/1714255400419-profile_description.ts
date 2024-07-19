import { MigrationInterface, QueryRunner } from "typeorm";

export class profileDescription1714255400419 implements MigrationInterface {
    name = "profileDescription1714255400419";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "description" text NOT NULL DEFAULT ''`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "description"`
        );
    }
}
