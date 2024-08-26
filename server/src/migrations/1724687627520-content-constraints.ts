import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentConstraints1724687627520 implements MigrationInterface {
    name = "ContentConstraints1724687627520";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_30711dcdd331d04b5179557d219"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "FK_30711dcdd331d04b5179557d219" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content_chunks" DROP CONSTRAINT "FK_30711dcdd331d04b5179557d219"`
        );
        await queryRunner.query(
            `ALTER TABLE "content_chunks" ADD CONSTRAINT "FK_30711dcdd331d04b5179557d219" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}
