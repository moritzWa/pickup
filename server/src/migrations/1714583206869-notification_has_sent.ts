import { MigrationInterface, QueryRunner } from "typeorm";

export class notificationHasSent1714583206869 implements MigrationInterface {
    name = 'notificationHasSent1714583206869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "has_sent" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "has_sent"`);
    }

}
