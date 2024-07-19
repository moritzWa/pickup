import { MigrationInterface, QueryRunner } from "typeorm";

export class userFeedbackEmail1707855969646 implements MigrationInterface {
    name = 'userFeedbackEmail1707855969646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "has_emailed_feedback" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "has_emailed_feedback"`);
    }

}
