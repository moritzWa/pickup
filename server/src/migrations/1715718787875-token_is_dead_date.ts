import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenIsDeadDate1715718787875 implements MigrationInterface {
    name = 'tokenIsDeadDate1715718787875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "last_checked_is_dead_unix_str" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "last_checked_is_dead_unix_str"`);
    }

}
