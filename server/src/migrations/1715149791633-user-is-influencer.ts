import { MigrationInterface, QueryRunner } from "typeorm";

export class userIsInfluencer1715149791633 implements MigrationInterface {
    name = "userIsInfluencer1715149791633";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "is_influencer" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "is_influencer"`
        );
    }
}
