import { MigrationInterface, QueryRunner } from "typeorm";

export class index1716596859472 implements MigrationInterface {
    name = 'index1716596859472'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_68b1d866de02dc337fa7972708" ON "feed_posts" ("token_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_68b1d866de02dc337fa7972708"`);
    }

}
