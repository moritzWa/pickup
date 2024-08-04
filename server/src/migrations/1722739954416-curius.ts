import { MigrationInterface, QueryRunner } from "typeorm";

export class Curius1722739954416 implements MigrationInterface {
    name = 'Curius1722739954416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" RENAME COLUMN "favorite" TO "full_text"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "full_text"`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "full_text" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "full_text"`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "full_text" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "curius_links" RENAME COLUMN "full_text" TO "favorite"`);
    }

}
