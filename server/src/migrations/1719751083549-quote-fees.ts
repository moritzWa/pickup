import { MigrationInterface, QueryRunner } from "typeorm";

export class quoteFees1719751083549 implements MigrationInterface {
    name = "quoteFees1719751083549";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quotes" ADD "fees" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
