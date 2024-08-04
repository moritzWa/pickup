import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentSesh1722796372185 implements MigrationInterface {
    name = "ContentSesh1722796372185";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "is_bookmarked" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" ADD "is_liked" boolean NOT NULL DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "username" boolean DEFAULT false`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "current_content_session_id" uuid`
        );
        await queryRunner.query(
            `CREATE INDEX "users_username_idx" ON "users" ("username") `
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_c54278defb1bb6193ad0624411c" FOREIGN KEY ("current_content_session_id") REFERENCES "content_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_c54278defb1bb6193ad0624411c"`
        );
        await queryRunner.query(`DROP INDEX "public"."users_username_idx"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "current_content_session_id"`
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "is_liked"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_sessions" DROP COLUMN "is_bookmarked"`
        );
    }
}
