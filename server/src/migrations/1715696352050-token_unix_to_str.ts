import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenUnixToStr1715696352050 implements MigrationInterface {
    name = 'tokenUnixToStr1715696352050'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "fdv_updated_at_unix_str" text`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "token_created_at_unix_str" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "token_created_at_unix_str"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "fdv_updated_at_unix_str"`);
    }

}
