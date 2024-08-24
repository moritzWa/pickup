import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthorCreated1724477418786 implements MigrationInterface {
    name = "AuthorCreated1724477418786";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "authors" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "authors" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP COLUMN "categories"`
        );
        await queryRunner.query(
            `ALTER TABLE "content" ADD "categories" jsonb NOT NULL DEFAULT '[]'`
        );
        await queryRunner.query(
            `ALTER TABLE "authors" DROP COLUMN "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "authors" DROP COLUMN "created_at"`
        );
    }
}
