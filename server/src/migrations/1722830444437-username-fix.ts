import { MigrationInterface, QueryRunner } from "typeorm";

export class UsernameFix1722830444437 implements MigrationInterface {
    name = "UsernameFix1722830444437";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_username_idx"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "username" text`);
        await queryRunner.query(
            `CREATE INDEX "users_username_idx" ON "users" ("username") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_username_idx"`);
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "embedding"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD "embedding" vector`
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
        await queryRunner.query(
            `ALTER TABLE "users" ADD "username" boolean DEFAULT false`
        );
        await queryRunner.query(
            `CREATE INDEX "users_username_idx" ON "users" ("username") `
        );
    }
}
