import { MigrationInterface, QueryRunner } from "typeorm";

export class txnUsers1707242982840 implements MigrationInterface {
    name = "txnUsers1707242982840";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP COLUMN "contract_address"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD "token_contract_address" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD "token_identifier" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD "user_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" DROP COLUMN "user_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP COLUMN "token_identifier"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP COLUMN "token_contract_address"`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD "contract_address" text NOT NULL`
        );
    }
}
