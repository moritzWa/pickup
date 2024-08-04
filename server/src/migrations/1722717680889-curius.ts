import { MigrationInterface, QueryRunner } from "typeorm";

export class Curius1722717680889 implements MigrationInterface {
    name = 'Curius1722717680889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_highlights" ALTER COLUMN "position" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_highlights" ALTER COLUMN "position" SET NOT NULL`);
    }

}
