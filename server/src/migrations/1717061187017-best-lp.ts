import { MigrationInterface, QueryRunner } from "typeorm";

export class bestLp1717061187017 implements MigrationInterface {
    name = "bestLp1717061187017";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD "best_lp_pool_address" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" DROP COLUMN "best_lp_pool_address"`
        );
    }
}
