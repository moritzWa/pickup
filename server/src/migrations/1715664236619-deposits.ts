import { MigrationInterface, QueryRunner } from "typeorm";

export class deposits1715664236619 implements MigrationInterface {
    name = "deposits1715664236619";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."deposit_status_enum" AS ENUM('pending', 'completed', 'canceled', 'failed')`
        );
        await queryRunner.query(
            `CREATE TABLE "deposits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" text NOT NULL, "paypal_order_id" text, "amount" numeric NOT NULL, "status" "public"."deposit_status_enum" NOT NULL, "has_sent_funds" boolean NOT NULL DEFAULT false, "transaction_hash" text, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_f49ba0cd446eaf7abb4953385d9" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "deposits" ADD CONSTRAINT "FK_109b9d3209e5c344dae2ca8f221" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "deposits" DROP CONSTRAINT "FK_109b9d3209e5c344dae2ca8f221"`
        );
        await queryRunner.query(`DROP TABLE "deposits"`);
        await queryRunner.query(`DROP TYPE "public"."deposit_status_enum"`);
    }
}
