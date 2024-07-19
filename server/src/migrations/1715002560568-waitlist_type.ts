import { MigrationInterface, QueryRunner } from "typeorm";

export class waitlistType1715002560568 implements MigrationInterface {
    name = 'waitlistType1715002560568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_waitlist_entries" ADD "type" text NOT NULL DEFAULT 'app'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_waitlist_entries" DROP COLUMN "type"`);
    }

}
