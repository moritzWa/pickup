import { MigrationInterface, QueryRunner } from "typeorm";

export class Curius1722730175670 implements MigrationInterface {
    name = "Curius1722730175670";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "createdDate"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "modifiedDate"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD "created_date" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD "modified_date" TIMESTAMP NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "relationships" DROP CONSTRAINT "FK_ad849fb13ab44985a1aa9d552f6"`
        );
        await queryRunner.query(
            `ALTER TABLE "relationships" DROP CONSTRAINT "FK_733c577e795f0f7f82f535c2cec"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "modified_date"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" DROP COLUMN "created_date"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "percent_finished"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "source_image_url"`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD "modifiedDate" TIMESTAMP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "curius_links" ADD "createdDate" TIMESTAMP`
        );
        await queryRunner.query(`DROP INDEX "public"."to_user_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."from_user_id_idx"`);
        await queryRunner.query(`DROP TABLE "relationships"`);
    }
}
