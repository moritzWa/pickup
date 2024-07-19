import { MigrationInterface, QueryRunner } from "typeorm";

export class tokenIsFreezeable1719613100676 implements MigrationInterface {
    name = 'tokenIsFreezeable1719613100676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."is_freezeable_enum" AS ENUM('yes', 'no', 'inconclusive')`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "is_freezeable" "public"."is_freezeable_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "is_freezeable"`);
        await queryRunner.query(`DROP TYPE "public"."is_freezeable_enum"`);
    }

}
