import { MigrationInterface, QueryRunner } from "typeorm";

export class isBanned1719590379445 implements MigrationInterface {
    name = 'isBanned1719590379445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_banned" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_banned"`);
    }

}
