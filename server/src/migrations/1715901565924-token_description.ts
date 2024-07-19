import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenDescription1715901565924 implements MigrationInterface {
    name = 'tokenDescription1715901565924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "description"`);
    }

}
