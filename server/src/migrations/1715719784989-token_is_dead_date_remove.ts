import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenIsDeadDateRemove1715719784989 implements MigrationInterface {
    name = 'tokenIsDeadDateRemove1715719784989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "last_checked_is_dead_unix_str"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "last_checked_is_dead_unix_str" text`);
    }

}
