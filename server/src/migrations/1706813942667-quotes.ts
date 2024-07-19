import { MigrationInterface, QueryRunner } from "typeorm";

export class quotes1706813942667 implements MigrationInterface {
    name = "quotes1706813942667";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" "public"."trading_provider_enum", "chain" text NOT NULL, "send_symbol" text NOT NULL, "send_icon_image_url" text NOT NULL, "receive_symbol" text NOT NULL, "receive_icon_image_url" text NOT NULL, "send_amount" numeric NOT NULL, "receive_amount" numeric NOT NULL, "send_fiat_amount_cents" numeric NOT NULL, "receive_fiat_amount_cents" numeric NOT NULL, "send_fiat_currency" text NOT NULL, "receive_fiat_currency" text NOT NULL, "estimated_swap_fiat_amount" numeric NOT NULL, "data" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "quotes"`);
    }
}
