import { MigrationInterface, QueryRunner } from "typeorm";

export class waitlistExtra1715100792495 implements MigrationInterface {
    name = 'waitlistExtra1715100792495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_waitlist_entries" ADD "extra" text NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_waitlist_entries" DROP COLUMN "extra"`);
    }

}
