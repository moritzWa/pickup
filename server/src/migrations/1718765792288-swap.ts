import { MigrationInterface, QueryRunner } from "typeorm";

export class swap1718765792288 implements MigrationInterface {
    name = "swap1718765792288";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "swaps" ADD "quote_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "swaps" DROP COLUMN "quote_id"`);
    }
}
