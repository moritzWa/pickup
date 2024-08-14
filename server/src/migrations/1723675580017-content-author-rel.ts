import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentAuthorRel1723675580017 implements MigrationInterface {
    name = 'ContentAuthorRel1723675580017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ALTER COLUMN "context" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ALTER COLUMN "context" SET NOT NULL`);
    }

}
