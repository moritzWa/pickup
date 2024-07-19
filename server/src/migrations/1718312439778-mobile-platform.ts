import { MigrationInterface, QueryRunner } from "typeorm";

export class mobilePlatform1718312439778 implements MigrationInterface {
    name = "mobilePlatform1718312439778";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "mobile_platform" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "mobile_platform"`
        );
    }
}
