import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenCleanup1715625347273 implements MigrationInterface {
    name = 'tokenCleanup1715625347273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "decimals"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "asset_key"`);
        await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "created_at" SET DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "updated_at" SET DEFAULT NOW()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tokens" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "asset_key" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "decimals" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "type" text NOT NULL`);
    }

}
