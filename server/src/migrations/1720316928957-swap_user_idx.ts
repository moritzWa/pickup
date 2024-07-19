import { MigrationInterface, QueryRunner } from "typeorm";

export class swapUserIdx1720316928957 implements MigrationInterface {
    name = "swapUserIdx1720316928957";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX "swaps_user_idx" ON "swaps" ("user_id") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."swaps_user_idx"`);
    }
}
