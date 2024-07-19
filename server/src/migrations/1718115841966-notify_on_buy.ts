import { MigrationInterface, QueryRunner } from "typeorm";

export class notifyOnBuy1718115841966 implements MigrationInterface {
    name = 'notifyOnBuy1718115841966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "relationships" ADD "notify_on_buy" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "relationships" DROP COLUMN "notify_on_buy"`);
    }

}
