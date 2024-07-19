import { MigrationInterface, QueryRunner } from "typeorm";

export class withdrawals1717341022804 implements MigrationInterface {
    name = "withdrawals1717341022804";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."withdrawal_status_enum" AS ENUM('pending', 'completed', 'sent_funds', 'canceled', 'failed')`
        );
        await queryRunner.query(
            `CREATE TABLE "withdrawals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "kado_order_id" text, "amount" numeric NOT NULL, "status" "public"."withdrawal_status_enum" NOT NULL, "failed_reason" text, "chain" text NOT NULL, "transaction_hash" text, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_9871ec481baa7755f8bd8b7c7e9" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_0bd35ddb3acfb323ae3e024d2f8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_0bd35ddb3acfb323ae3e024d2f8"`
        );
        await queryRunner.query(`DROP TABLE "withdrawals"`);
        await queryRunner.query(`DROP TYPE "public"."withdrawal_status_enum"`);
    }
}
