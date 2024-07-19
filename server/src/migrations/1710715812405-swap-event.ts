import { MigrationInterface, QueryRunner } from "typeorm";

export class swapEvent1710715812405 implements MigrationInterface {
    name = "swapEvent1710715812405";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "swap_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chain" text NOT NULL, "duration_seconds" numeric, "status" "public"."swap_status_enum" NOT NULL, "is_timed_out" boolean, "hash" text NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "swap_event_hash_chain_idx" UNIQUE ("hash", "chain"), CONSTRAINT "PK_11bd25aa1475bed2a9e4ac2add6" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "app_waitlist_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "friend_email" text NOT NULL, "twitter" text NOT NULL, "friend_twitter" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "app_waitlist_entries_email_idx" UNIQUE ("email"), CONSTRAINT "PK_9f8891542118e7e9ca110fe481a" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "finalized_at" TIMESTAMP`
        );
        await queryRunner.query(
            `ALTER TABLE "swap_events" ADD CONSTRAINT "FK_7847be69c34cfeaf92c7852b019" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swap_events" DROP CONSTRAINT "FK_7847be69c34cfeaf92c7852b019"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP COLUMN "finalized_at"`
        );
        await queryRunner.query(`DROP TABLE "app_waitlist_entries"`);
        await queryRunner.query(`DROP TABLE "swap_events"`);
    }
}
