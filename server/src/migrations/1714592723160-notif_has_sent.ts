import { MigrationInterface, QueryRunner } from "typeorm";

export class notifHasSent1714592723160 implements MigrationInterface {
    name = 'notifHasSent1714592723160'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "has_sent" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "has_sent" SET DEFAULT true`);
    }

}
