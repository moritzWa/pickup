import { MigrationInterface, QueryRunner } from "typeorm";

export class IsArchived1723529093111 implements MigrationInterface {
    name = "IsArchived1723529093111";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feed_items" ADD "is_archived" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feed_items" DROP COLUMN "is_archived"`
        );
    }
}
