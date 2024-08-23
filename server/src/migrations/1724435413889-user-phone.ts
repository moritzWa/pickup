import { MigrationInterface, QueryRunner } from "typeorm";

export class UserPhone1724435413889 implements MigrationInterface {
    name = "UserPhone1724435413889";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX "users_phone_number_idx" ON "users" ("phone_number") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_phone_number_idx"`);
    }
}
