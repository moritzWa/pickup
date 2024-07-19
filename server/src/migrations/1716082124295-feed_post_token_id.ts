import { MigrationInterface, QueryRunner } from "typeorm";

export class feedPostTokenId1716082124295 implements MigrationInterface {
    name = 'feedPostTokenId1716082124295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feed_posts" ADD "token_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feed_posts" ADD CONSTRAINT "FK_68b1d866de02dc337fa7972708b" FOREIGN KEY ("token_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feed_posts" DROP CONSTRAINT "FK_68b1d866de02dc337fa7972708b"`);
        await queryRunner.query(`ALTER TABLE "feed_posts" DROP COLUMN "token_id"`);
    }

}
