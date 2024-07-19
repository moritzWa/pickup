import { MigrationInterface, QueryRunner } from "typeorm";

export class removeUnixNumFields1715703424379 implements MigrationInterface {
    name = 'removeUnixNumFields1715703424379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "fdv_updated_at_unix"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "token_created_at_unix"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "token_created_at_unix" numeric`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "fdv_updated_at_unix" numeric`);
    }

}
