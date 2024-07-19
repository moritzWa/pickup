import { MigrationInterface, QueryRunner } from "typeorm";

export class notificationIdp1718250252549 implements MigrationInterface {
    name = "notificationIdp1718250252549";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD "idempotency" text`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "UQ_2a7781b26a867eae700d9bd9bb8" UNIQUE ("idempotency")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "UQ_2a7781b26a867eae700d9bd9bb8"`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP COLUMN "idempotency"`
        );
    }
}
