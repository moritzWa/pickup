import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenTelegram1715902820345 implements MigrationInterface {
    name = 'tokenTelegram1715902820345'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "telegram_link" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "telegram_link"`);
    }

}
