import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenSlug1716014501193 implements MigrationInterface {
    name = "tokenSlug1716014501193";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "slug" text`);
        await queryRunner.query(
            `CREATE UNIQUE INDEX "token_slug_idx" ON "tokens" ("slug") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."token_slug_idx"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "slug"`);
    }
}
