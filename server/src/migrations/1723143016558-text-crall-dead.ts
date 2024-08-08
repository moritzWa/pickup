import { MigrationInterface, QueryRunner } from "typeorm";

export class TextCrallDead1723143016558 implements MigrationInterface {
    name = 'TextCrallDead1723143016558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" ADD "deadLink" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_links" DROP COLUMN "deadLink"`);
    }

}
