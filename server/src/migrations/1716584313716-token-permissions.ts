import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenPermissions1716584313716 implements MigrationInterface {
    name = "tokenPermissions1716584313716";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "token_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "token_permissions_token_user_idx" UNIQUE ("token_id", "user_id"), CONSTRAINT "PK_f3717573cfce69e071965c9fa98" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" DROP CONSTRAINT "category_entry_token_idx"`
        );
        await queryRunner.query(
            `ALTER TYPE "public"."category_enum" RENAME TO "category_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."category_enum" AS ENUM('united_nations', 'politics', 'religion', 'celebrities', 'athletes', 'corporations')`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" ALTER COLUMN "category" TYPE "public"."category_enum" USING "category"::"text"::"public"."category_enum"`
        );
        await queryRunner.query(`DROP TYPE "public"."category_enum_old"`);
        await queryRunner.query(
            `ALTER TABLE "category_entries" ADD CONSTRAINT "category_entry_token_idx" UNIQUE ("token_id", "category")`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD CONSTRAINT "FK_430cf9fb7f974e9a3c32563e771" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD CONSTRAINT "FK_5e4e5053802b77a34b301ccbf77" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP CONSTRAINT "FK_5e4e5053802b77a34b301ccbf77"`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP CONSTRAINT "FK_430cf9fb7f974e9a3c32563e771"`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" DROP CONSTRAINT "category_entry_token_idx"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."category_enum_old" AS ENUM('celebrities', 'politics', 'religion', 'united_nations')`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" ALTER COLUMN "category" TYPE "public"."category_enum_old" USING "category"::"text"::"public"."category_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."category_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."category_enum_old" RENAME TO "category_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "category_entries" ADD CONSTRAINT "category_entry_token_idx" UNIQUE ("category", "token_id")`
        );
        await queryRunner.query(`DROP TABLE "token_permissions"`);
    }
}
