import { MigrationInterface, QueryRunner } from "typeorm";

export class groups1711822867185 implements MigrationInterface {
    name = "groups1711822867185";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "waitlist_group_members" ADD "is_owner" boolean NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "waitlist_group_members_group_id_index" ON "waitlist_group_members" ("group_id") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "waitlist_groups_referral_code_index" ON "waitlist_groups" ("referral_code") `
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_group_members" ADD CONSTRAINT "waitlist_group_members_group_id_phone_number_key" UNIQUE ("group_id", "phone_number")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "waitlist_group_members" DROP CONSTRAINT "waitlist_group_members_group_id_phone_number_key"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_groups_referral_code_index"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."waitlist_group_members_group_id_index"`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_group_members" DROP COLUMN "is_owner"`
        );
    }
}
