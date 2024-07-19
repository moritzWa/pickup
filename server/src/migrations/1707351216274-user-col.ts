import { MigrationInterface, QueryRunner } from "typeorm";

export class userCol1707351216274 implements MigrationInterface {
    name = "userCol1707351216274";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "user_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_7d50ef17f25bafbb1a6342c315b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_7d50ef17f25bafbb1a6342c315b"`
        );
        await queryRunner.query(`ALTER TABLE "swaps" DROP COLUMN "user_id"`);
    }
}
