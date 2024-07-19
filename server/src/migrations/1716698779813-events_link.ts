import { MigrationInterface, QueryRunner } from "typeorm";

export class eventsLink1716698779813 implements MigrationInterface {
    name = 'eventsLink1716698779813'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "link" text NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "link"`);
    }

}
