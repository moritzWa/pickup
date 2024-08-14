import { MigrationInterface, QueryRunner } from "typeorm";

export class Content1723616888332 implements MigrationInterface {
    name = "Content1723616888332";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "content" text`);
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "PK_fe57bc738dc681ac7fb577ec1c0"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP COLUMN "id"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "PK_fe57bc738dc681ac7fb577ec1c0" PRIMARY KEY ("id")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "PK_fe57bc738dc681ac7fb577ec1c0"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP COLUMN "id"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD "id" SERIAL NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "PK_fe57bc738dc681ac7fb577ec1c0" PRIMARY KEY ("id")`
        );
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "content"`);
    }
}
