import { MigrationInterface, QueryRunner } from "typeorm";

export class notificationToken1718253446108 implements MigrationInterface {
    name = "notificationToken1718253446108";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD "token_contract_address" text`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD "token_provider" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP COLUMN "token_provider"`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP COLUMN "token_contract_address"`
        );
    }
}
