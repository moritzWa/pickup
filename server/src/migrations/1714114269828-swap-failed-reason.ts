import { MigrationInterface, QueryRunner } from "typeorm";

export class swapFailedReason1714114269828 implements MigrationInterface {
    name = "swapFailedReason1714114269828";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "swaps" ADD "failed_reason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "failed_reason"`
        );
    }
}
