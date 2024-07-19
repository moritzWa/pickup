import { MigrationInterface, QueryRunner } from "typeorm";

export class readFriendsUntil1714666727925 implements MigrationInterface {
    name = 'readFriendsUntil1714666727925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "read_friends_until" TIMESTAMP NOT NULL DEFAULT NOW()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "read_friends_until"`);
    }

}
