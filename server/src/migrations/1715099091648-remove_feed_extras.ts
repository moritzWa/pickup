import { MigrationInterface, QueryRunner } from "typeorm";

export class removeFeedExtras1715099091648 implements MigrationInterface {
    name = 'removeFeedExtras1715099091648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."feed_posts_contract_address_provider_idx"`);
        await queryRunner.query(`ALTER TABLE "feed_posts" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "feed_posts" DROP COLUMN "contract_address"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feed_posts" ADD "contract_address" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feed_posts" ADD "provider" text NOT NULL`);
        await queryRunner.query(`CREATE INDEX "feed_posts_contract_address_provider_idx" ON "feed_posts" ("provider", "contract_address") `);
    }

}
