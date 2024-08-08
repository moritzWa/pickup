import { MigrationInterface, QueryRunner } from "typeorm";

export class QueueUniqIdx1723138220126 implements MigrationInterface {
    name = "QueueUniqIdx1723138220126";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX "user_created_at_idx" ON "queue" ("user_id", "created_at" DESC) `
        );
        await queryRunner.query(
            `CREATE INDEX "user_position_idx" ON "queue" ("user_id", "position" ASC) `
        );
        await queryRunner.query(
            `ALTER TABLE "queue" ADD CONSTRAINT "UQ_5f948db6f8b0d8f9be1607f7512" UNIQUE ("user_id", "content_id", "position")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "queue" DROP CONSTRAINT "UQ_5f948db6f8b0d8f9be1607f7512"`
        );
        await queryRunner.query(`DROP INDEX "public"."user_position_idx"`);
        await queryRunner.query(`DROP INDEX "public"."user_created_at_idx"`);
    }
}
