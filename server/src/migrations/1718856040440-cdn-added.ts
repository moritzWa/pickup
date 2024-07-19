import { MigrationInterface, QueryRunner } from "typeorm";

export class cdnAdded1718856040440 implements MigrationInterface {
    name = "cdnAdded1718856040440";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD "has_added_to_cdn" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" DROP COLUMN "has_added_to_cdn"`
        );
    }
}
