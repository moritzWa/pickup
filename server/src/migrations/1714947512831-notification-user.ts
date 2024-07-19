import { MigrationInterface, QueryRunner } from "typeorm";

export class notificationUser1714947512831 implements MigrationInterface {
    name = 'notificationUser1714947512831'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "follower_user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_552c0264daa625608bd03bc6838" FOREIGN KEY ("follower_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_552c0264daa625608bd03bc6838"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "follower_user_id"`);
    }

}
