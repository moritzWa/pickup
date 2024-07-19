import { MigrationInterface, QueryRunner } from "typeorm";

export class uniqueRelationships1713912147836 implements MigrationInterface {
    name = 'uniqueRelationships1713912147836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "relationships" ADD CONSTRAINT "relationships_idx" UNIQUE ("from_user_id", "to_user_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "relationships" DROP CONSTRAINT "relationships_idx"`);
    }

}
