import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationFields21724443954200 implements MigrationInterface {
    name = "NotificationFields21724443954200";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_552c0264daa625608bd03bc6838" FOREIGN KEY ("follower_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_552c0264daa625608bd03bc6838"`
        );
    }
}
