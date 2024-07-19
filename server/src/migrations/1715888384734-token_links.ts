import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenLinks1715888384734 implements MigrationInterface {
    name = 'tokenLinks1715888384734'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "twitter_link" text`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "website_link" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "website_link"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "twitter_link"`);
    }

}
