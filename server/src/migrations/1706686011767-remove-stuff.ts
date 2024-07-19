import { MigrationInterface, QueryRunner } from "typeorm";

export class removeStuff1706686011767 implements MigrationInterface {
    name = "removeStuff1706686011767";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_ae39047bdb0e675ea2d6b60fa6b"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP CONSTRAINT "FK_c7436620804208a7496ad03aff9"`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP CONSTRAINT "FK_19c7b855fba3868d55da7cda812"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_32b8c6ed4689a45b16b2dfe478d"`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_ca7853468de7e71517c919ddf59"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."users_active_client_id_idx"`
        );
        await queryRunner.query(`DROP INDEX "public"."quotes_client_idx"`);
        await queryRunner.query(`DROP INDEX "public"."quotes_account_idx"`);
        await queryRunner.query(`DROP INDEX "public"."swaps_client_idx"`);
        await queryRunner.query(`DROP INDEX "public"."swaps_account_idx"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "active_client_id"`
        );
        await queryRunner.query(`ALTER TABLE "quotes" DROP COLUMN "client_id"`);
        await queryRunner.query(
            `ALTER TABLE "quotes" DROP COLUMN "account_id"`
        );
        await queryRunner.query(`ALTER TABLE "swaps" DROP COLUMN "client_id"`);
        await queryRunner.query(`ALTER TABLE "swaps" DROP COLUMN "account_id"`);
        // drop table accounts
        await queryRunner.query(`DROP TABLE "asset_holdings"`);
        await queryRunner.query(`DROP TABLE "client_permissions"`);
        await queryRunner.query(`DROP TABLE "default_rules"`);
        await queryRunner.query(`DROP TABLE "exchange_rates"`);
        await queryRunner.query(`DROP TABLE "fees"`);
        await queryRunner.query(`DROP TABLE "filter_form_cpas"`);
        await queryRunner.query(`DROP TABLE "filter_form_submissions"`);
        await queryRunner.query(`DROP TABLE "ledger_entry_links"`);

        await queryRunner.query(`DROP TABLE "ledger_entries" CASCADE`);
        await queryRunner.query(`DROP TABLE "ledger_accounts" CASCADE`);

        await queryRunner.query(`DROP TABLE "packs"`);
        await queryRunner.query(`DROP TABLE "pending_users"`);
        await queryRunner.query(`DROP TABLE "portfolio_waitlist"`);
        await queryRunner.query(`DROP TABLE "recalculate_summaries"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TABLE "referrals"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TABLE "spam_assets"`);
        await queryRunner.query(`DROP TABLE "subscription_upgrades"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "transactions" CASCADE`);
        await queryRunner.query(`DROP TABLE "rules" CASCADE`);

        await queryRunner.query(`DROP TABLE "transfers"`);
        await queryRunner.query(`DROP TABLE "waitlist"`);
        await queryRunner.query(`DROP TABLE "whitelist"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TABLE "assets"`);
        await queryRunner.query(`DROP TABLE "clients"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "account_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "client_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "account_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD "client_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "active_client_id" uuid`
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_account_idx" ON "swaps" ("account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_client_idx" ON "swaps" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "quotes_account_idx" ON "quotes" ("account_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "quotes_client_idx" ON "quotes" ("client_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "users_active_client_id_idx" ON "users" ("active_client_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_ca7853468de7e71517c919ddf59" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_32b8c6ed4689a45b16b2dfe478d" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD CONSTRAINT "FK_19c7b855fba3868d55da7cda812" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "quotes" ADD CONSTRAINT "FK_c7436620804208a7496ad03aff9" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_ae39047bdb0e675ea2d6b60fa6b" FOREIGN KEY ("active_client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}
