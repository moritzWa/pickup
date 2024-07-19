import { MigrationInterface, QueryRunner } from "typeorm";

export class userVersion1715712016119 implements MigrationInterface {
    name = "userVersion1715712016119";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "mobile_app_version" text`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "mobile_device_id" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "mobile_device_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "mobile_app_version"`
        );
    }
}
