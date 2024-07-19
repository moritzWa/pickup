import { MigrationInterface, QueryRunner } from "typeorm";

export class venmoAllowed1715750135275 implements MigrationInterface {
    name = "venmoAllowed1715750135275";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "can_venmo_deposit" boolean NOT NULL DEFAULT true`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "can_venmo_deposit"`
        );
    }
}
