import { MigrationInterface, QueryRunner } from "typeorm";

export class isDeadEnum1719327065759 implements MigrationInterface {
    name = 'isDeadEnum1719327065759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."is_dead_enum" AS ENUM('dead', 'alive', 'inconclusive')`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD "is_dead_enum" "public"."is_dead_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "is_dead_enum"`);
        await queryRunner.query(`DROP TYPE "public"."is_dead_enum"`);
    }

}
