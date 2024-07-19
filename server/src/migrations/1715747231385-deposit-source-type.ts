import { MigrationInterface, QueryRunner } from "typeorm";

export class depositSourceType1715747231385 implements MigrationInterface {
    name = "depositSourceType1715747231385";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "deposits" ADD "source_type" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "deposits" DROP COLUMN "source_type"`
        );
    }
}
