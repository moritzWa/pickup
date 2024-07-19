import { MigrationInterface, QueryRunner } from "typeorm";

export class usernameSynced1713898438357 implements MigrationInterface {
    name = 'usernameSynced1713898438357'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "username_synced" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "users_username_synced_idx" ON "users" ("username_synced") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_username_synced_idx"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username_synced"`);
    }

}
