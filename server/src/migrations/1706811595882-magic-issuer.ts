import { MigrationInterface, QueryRunner } from "typeorm";

export class magicIssuer1706811595882 implements MigrationInterface {
    name = "magicIssuer1706811595882";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "magic_issuer" text not null`
        );
        await queryRunner.query(
            `CREATE INDEX "users_magic_issuer_idx" ON "users" ("magic_issuer") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."users_magic_issuer_idx"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "magic_issuer"`
        );
    }
}
