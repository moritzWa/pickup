import { MigrationInterface, QueryRunner } from "typeorm";

export class userPhoneNumber1714180918090 implements MigrationInterface {
    name = "userPhoneNumber1714180918090";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_phone_number_idx"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX "users_phone_number_idx" ON "users" ("phone_number") `
        );
    }
}
