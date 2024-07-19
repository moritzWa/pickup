import { MigrationInterface, QueryRunner } from "typeorm";

export class blacklistTokenCreatedAtUpdatedAt1712435028470 implements MigrationInterface {
    name = 'blacklistTokenCreatedAtUpdatedAt1712435028470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."blacklist_token_coingecko_id_idx"`);
        await queryRunner.query(`ALTER TABLE "blacklist_tokens" DROP COLUMN "coingecko_id"`);
        await queryRunner.query(`ALTER TABLE "blacklist_tokens" ALTER COLUMN "created_at" SET DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "blacklist_tokens" ALTER COLUMN "updated_at" SET DEFAULT NOW()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blacklist_tokens" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blacklist_tokens" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blacklist_tokens" ADD "coingecko_id" text`);
        await queryRunner.query(`CREATE INDEX "blacklist_token_coingecko_id_idx" ON "blacklist_tokens" ("coingecko_id") `);
    }

}
