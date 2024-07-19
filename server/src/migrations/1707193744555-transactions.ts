import { MigrationInterface, QueryRunner } from "typeorm";

export class transactions1707193744555 implements MigrationInterface {
    name = "transactions1707193744555";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."transfer_type_enum" AS ENUM('sent', 'received', 'internal')`
        );
        await queryRunner.query(
            `CREATE TABLE "transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transfer_type_enum" NOT NULL, "amount" numeric NOT NULL, "from" text, "to" text, "symbol" text NOT NULL, "icon_image_url" text, "decimals" integer NOT NULL, "provider" text NOT NULL, "contract_address" text NOT NULL, "transaction_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_f712e908b465e0085b4408cabc3" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."transaction_type_enum" AS ENUM('deposit', 'trade')`
        );
        await queryRunner.query(
            `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transaction_type_enum" NOT NULL, "hash" text NOT NULL, "provider" text NOT NULL, "description" text, "block_explorer_url" text NOT NULL, "fee_paid_amount" numeric NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "transfers" ADD CONSTRAINT "FK_6a909992251fdc3b8f0ee840eb3" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transfers" DROP CONSTRAINT "FK_6a909992251fdc3b8f0ee840eb3"`
        );
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "transfers"`);
        await queryRunner.query(`DROP TYPE "public"."transfer_type_enum"`);
    }
}
