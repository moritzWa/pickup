import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentAdj1721861204635 implements MigrationInterface {
    name = "ContentAdj1721861204635";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD "categories" jsonb NOT NULL DEFAULT '[]'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "categories"`
        );
    }
}
