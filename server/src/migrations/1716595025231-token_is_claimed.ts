import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenIsClaimed1716595025231 implements MigrationInterface {
    name = "tokenIsClaimed1716595025231";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" ADD "is_claimed" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tokens" DROP COLUMN "is_claimed"`
        );
    }
}
