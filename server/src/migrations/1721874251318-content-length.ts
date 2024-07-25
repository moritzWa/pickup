import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentLength1721874251318 implements MigrationInterface {
    name = "ContentLength1721874251318";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "length_seconds" integer NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "length_seconds"`
        );
    }
}
