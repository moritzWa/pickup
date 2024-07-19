import { MigrationInterface, QueryRunner } from "typeorm";

export class category1715886385123 implements MigrationInterface {
    name = 'category1715886385123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."category_enum" AS ENUM('united_nations', 'politics', 'religion')`);
        await queryRunner.query(`CREATE TABLE "category_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category" "public"."category_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), "token_id" uuid NOT NULL, CONSTRAINT "PK_18d9808ec0525bcaf6b8865c77c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "category_idx" ON "category_entries" ("category") `);
        await queryRunner.query(`ALTER TABLE "category_entries" ADD CONSTRAINT "FK_7e2b05d8bdf74f8e54a3321c9aa" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category_entries" DROP CONSTRAINT "FK_7e2b05d8bdf74f8e54a3321c9aa"`);
        await queryRunner.query(`DROP INDEX "public"."category_idx"`);
        await queryRunner.query(`DROP TABLE "category_entries"`);
        await queryRunner.query(`DROP TYPE "public"."category_enum"`);
    }

}
