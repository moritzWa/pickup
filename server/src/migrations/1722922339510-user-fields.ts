import { MigrationInterface, QueryRunner } from "typeorm";

export class UserFields1722922339510 implements MigrationInterface {
    name = "UserFields1722922339510";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "interest_description" text`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "interest_categories" jsonb NOT NULL DEFAULT '[]'`
        );
        await queryRunner.query(`ALTER TABLE "users" ADD "timezone" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "commute_time" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
