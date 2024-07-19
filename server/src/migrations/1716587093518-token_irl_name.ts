import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenIrlName1716587093518 implements MigrationInterface {
    name = 'tokenIrlName1716587093518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "irl_name" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "irl_name"`);
    }

}
