import { MigrationInterface, QueryRunner } from "typeorm";

export class userRefCommish1717875245828 implements MigrationInterface {
    name = "userRefCommish1717875245828";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "commission_percentage" numeric NOT NULL DEFAULT '0'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "commission_percentage"`
        );
    }
}
