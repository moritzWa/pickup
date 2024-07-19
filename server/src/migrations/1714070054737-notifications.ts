import { MigrationInterface, QueryRunner } from "typeorm";

export class notifications1714070054737 implements MigrationInterface {
    name = "notifications1714070054737";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "icon_image_url" text, "title" text NOT NULL, "subtitle" text NOT NULL, "has_read" boolean NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "notifications_user_id_idx" ON "notifications" ("user_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."notifications_user_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "notifications"`);
    }
}
