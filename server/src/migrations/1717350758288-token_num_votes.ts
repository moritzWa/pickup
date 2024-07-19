import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenNumVotes1717350758288 implements MigrationInterface {
    name = 'tokenNumVotes1717350758288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "num_votes" numeric NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "num_votes"`);
    }

}
