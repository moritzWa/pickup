import { MigrationInterface, QueryRunner } from "typeorm";

export class appWaitlistRemoveFriendTwitter1710858227290 implements MigrationInterface {
    name = 'appWaitlistRemoveFriendTwitter1710858227290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_waitlist_entries" DROP COLUMN "friend_twitter"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_waitlist_entries" ADD "friend_twitter" text NOT NULL`);
    }

}
