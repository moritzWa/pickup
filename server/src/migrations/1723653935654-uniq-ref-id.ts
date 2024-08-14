import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqRefId1723653935654 implements MigrationInterface {
    name = "UniqRefId1723653935654";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" ADD CONSTRAINT "UQ_aa7dc3c0880dd53f18779a70bf1" UNIQUE ("reference_id")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "content" DROP CONSTRAINT "UQ_aa7dc3c0880dd53f18779a70bf1"`
        );
    }
}
