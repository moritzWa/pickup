import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenIsDead1715718481645 implements MigrationInterface {
    name = 'tokenIsDead1715718481645'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "is_dead" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "is_dead"`);
    }

}
