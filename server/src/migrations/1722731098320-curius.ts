import { MigrationInterface, QueryRunner } from "typeorm";

export class Curius1722731098320 implements MigrationInterface {
    name = 'Curius1722731098320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_mentions" RENAME COLUMN "createdDate" TO "created_date"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" RENAME COLUMN "createdDate" TO "created_date"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP COLUMN "createdDate"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP COLUMN "modifiedDate"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD "created_date" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD "modified_date" TIMESTAMP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP COLUMN "modified_date"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP COLUMN "created_date"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD "modifiedDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD "createdDate" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" RENAME COLUMN "created_date" TO "createdDate"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" RENAME COLUMN "created_date" TO "createdDate"`);
    }

}
