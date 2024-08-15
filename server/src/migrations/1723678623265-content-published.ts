import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentPublished1723678623265 implements MigrationInterface {
    name = 'ContentPublished1723678623265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "published_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "published_at"`);
    }

}
