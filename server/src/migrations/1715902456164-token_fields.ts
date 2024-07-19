import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenFields1715902456164 implements MigrationInterface {
    name = 'tokenFields1715902456164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "banner_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "banner_url"`);
    }

}
