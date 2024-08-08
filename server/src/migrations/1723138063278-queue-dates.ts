import { MigrationInterface, QueryRunner } from "typeorm";

export class QueueDates1723138063278 implements MigrationInterface {
    name = "QueueDates1723138063278";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "queue" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `ALTER TABLE "queue" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "queue" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "queue" DROP COLUMN "created_at"`);
    }
}
