import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenMoreLinks1716001708367 implements MigrationInterface {
    name = 'tokenMoreLinks1716001708367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "more_links" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "more_links"`);
    }

}
