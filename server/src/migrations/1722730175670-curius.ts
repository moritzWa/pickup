import { MigrationInterface, QueryRunner } from "typeorm";

export class Curius1722730175670 implements MigrationInterface {
    name = 'Curius1722730175670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "relationships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "from_user_id" uuid NOT NULL, "to_user_id" uuid NOT NULL, CONSTRAINT "relationships_idx" UNIQUE ("from_user_id", "to_user_id"), CONSTRAINT "PK_ba20e2f5cf487408e08e4dcecaf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "from_user_id_idx" ON "relationships" ("from_user_id") `);
        await queryRunner.query(`CREATE INDEX "to_user_id_idx" ON "relationships" ("to_user_id") `);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "createdDate"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "modifiedDate"`);
        await queryRunner.query(`ALTER TABLE "content" ADD "source_image_url" text`);
        await queryRunner.query(`ALTER TABLE "content_sessions" ADD "percent_finished" numeric`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "created_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "modified_date" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "relationships" ADD CONSTRAINT "FK_733c577e795f0f7f82f535c2cec" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "relationships" ADD CONSTRAINT "FK_ad849fb13ab44985a1aa9d552f6" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "relationships" DROP CONSTRAINT "FK_ad849fb13ab44985a1aa9d552f6"`);
        await queryRunner.query(`ALTER TABLE "relationships" DROP CONSTRAINT "FK_733c577e795f0f7f82f535c2cec"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "modified_date"`);
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "created_date"`);
        await queryRunner.query(`ALTER TABLE "content_sessions" DROP COLUMN "percent_finished"`);
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "source_image_url"`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "modifiedDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "createdDate" TIMESTAMP`);
        await queryRunner.query(`DROP INDEX "public"."to_user_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."from_user_id_idx"`);
        await queryRunner.query(`DROP TABLE "relationships"`);
    }

}
