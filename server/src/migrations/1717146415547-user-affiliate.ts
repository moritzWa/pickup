import { MigrationInterface, QueryRunner } from "typeorm";

export class userAffiliate1717146415547 implements MigrationInterface {
    name = 'userAffiliate1717146415547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_affiliate" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_affiliate"`);
    }

}
