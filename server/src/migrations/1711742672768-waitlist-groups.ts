import { MigrationInterface, QueryRunner } from "typeorm";

export class waitlistGroups1711742672768 implements MigrationInterface {
    name = "waitlistGroups1711742672768";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "waitlist_group_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "phone_number" text, "group_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_ffd320d774b94b907a198f2c02c" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "waitlist_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "memecoin" text NOT NULL, "memecoin_image_url" text NOT NULL, "referral_code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_66a78565da1f1671cc875512deb" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "waitlist_group_members" ADD CONSTRAINT "FK_c62e60d8506d7cc7252152d7f43" FOREIGN KEY ("group_id") REFERENCES "waitlist_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "waitlist_group_members" DROP CONSTRAINT "FK_c62e60d8506d7cc7252152d7f43"`
        );
        await queryRunner.query(`DROP TABLE "waitlist_groups"`);
        await queryRunner.query(`DROP TABLE "waitlist_group_members"`);
    }
}
