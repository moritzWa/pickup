import { MigrationInterface, QueryRunner } from "typeorm";

export class UserSesh1724716622977 implements MigrationInterface {
    name = "UserSesh1724716622977";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_9314068583a2383c58f24b528d5"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_c54278defb1bb6193ad0624411c"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_c54278defb1bb6193ad0624411c" FOREIGN KEY ("current_content_session_id") REFERENCES "content_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_9314068583a2383c58f24b528d5" FOREIGN KEY ("current_feed_item_id") REFERENCES "feed_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_authors" DROP CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_9314068583a2383c58f24b528d5"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_c54278defb1bb6193ad0624411c"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_content_authors_author_id" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_c54278defb1bb6193ad0624411c" FOREIGN KEY ("current_content_session_id") REFERENCES "content_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_9314068583a2383c58f24b528d5" FOREIGN KEY ("current_feed_item_id") REFERENCES "feed_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }
}
