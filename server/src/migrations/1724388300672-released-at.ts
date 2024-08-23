import { MigrationInterface, QueryRunner } from "typeorm";

export class ReleasedAt1724388300672 implements MigrationInterface {
    name = "ReleasedAt1724388300672";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX "content_released_at_idx" ON "content" ("released_at" desc) `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."content_released_at_idx"`
        );
    }
}
