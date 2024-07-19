import { MigrationInterface, QueryRunner } from "typeorm";

export class isMvmtVerified1716973694644 implements MigrationInterface {
    name = "isMvmtVerified1716973694644";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD "is_movement_verified" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" DROP COLUMN "is_movement_verified"`
        );
    }
}
