import { MigrationInterface, QueryRunner } from "typeorm";

export class username1713302292403 implements MigrationInterface {
    name = "username1713302292403";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // `ALTER TABLE "users" ADD "username" text NOT NULL DEFAULT ''` only if that column doesn't already exist
        await queryRunner.query(
            `ALTER TABLE "users" ADD "username" text NOT NULL DEFAULT ''`
        );
        await queryRunner.query(
            `CREATE INDEX "users_username_idx" ON "users" ("username") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_username_idx"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }
}
