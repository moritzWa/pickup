import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenAlgoliaFields1715625931258 implements MigrationInterface {
    name = 'tokenAlgoliaFields1715625931258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "vol24h" numeric`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "fdv" numeric`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "fdv_updated_at_unix" numeric`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "fdv_dne" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "token_created_at_unix" numeric`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "token_created_at_dne" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "is_strict" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "is_strict"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "token_created_at_dne"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "token_created_at_unix"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "fdv_dne"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "fdv_updated_at_unix"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "fdv"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "vol24h"`);
    }

}
