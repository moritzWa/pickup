import { MigrationInterface, QueryRunner } from "typeorm";

export class initialSchemas1721583692347 implements MigrationInterface {
    name = "initialSchemas1721583692347";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."auth_provider_enum" AS ENUM('firebase')`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'basic_admin')`
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_number" text, "unread_count" numeric NOT NULL DEFAULT '0', "has_verified_phone_number" boolean NOT NULL DEFAULT false, "email" text NOT NULL, "name" text, "description" text NOT NULL DEFAULT '', "referral_code" text NOT NULL DEFAULT '', "image_url" text, "auth_provider" "public"."auth_provider_enum" NOT NULL, "auth_provider_id" text NOT NULL, "mobile_app_version" text, "mobile_platform" text, "mobile_device_id" text, "has_two_factor_auth" boolean NOT NULL DEFAULT false, "has_mobile" boolean NOT NULL DEFAULT false, "has_push_notifications_enabled" boolean NOT NULL DEFAULT false, "number" integer, "referred_by_code" text, "referred_by_name" text, "stripe_customer_id" text, "is_influencer" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), "is_superuser" boolean NOT NULL DEFAULT false, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `
        );
        await queryRunner.query(
            `CREATE INDEX "users_referral_code_idx" ON "users" ("referral_code") `
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_1c844df74e011d4b0694ad5b2c" ON "users" ("auth_provider_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "users_has_mobile_idx" ON "users" ("has_mobile") `
        );
        await queryRunner.query(
            `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "icon_image_url" text, "title" text NOT NULL, "subtitle" text NOT NULL, "has_read" boolean NOT NULL, "has_sent" boolean NOT NULL DEFAULT false, "idempotency" text, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_2a7781b26a867eae700d9bd9bb8" UNIQUE ("idempotency"), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "notifications_user_id_idx" ON "notifications" ("user_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "characters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "context" text NOT NULL, "image_url" text NOT NULL, "name" text NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_9d731e05758f26b9315dac5e378" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "messages_user_id_idx" ON "characters" ("user_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "subtitle" text NOT NULL, "image_url" text NOT NULL, "text_color" text NOT NULL, "background_color" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL, "is_bot" boolean NOT NULL DEFAULT false, "course_id" uuid NOT NULL, "user_id" uuid, "character_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "participants_character_id_course_id_unique" UNIQUE ("character_id", "course_id"), CONSTRAINT "participants_course_id_user_id_unique" UNIQUE ("course_id", "user_id"), CONSTRAINT "PK_1cda06c31eec1c95b3365a0283f" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."lesson_type_enum" AS ENUM('game', 'vocabulary', 'role_play')`
        );
        await queryRunner.query(
            `CREATE TABLE "lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."lesson_type_enum" NOT NULL, "title" text NOT NULL, "subtitle" text NOT NULL, "content" text NOT NULL, "roles" jsonb NOT NULL DEFAULT '[]', "participant_id" uuid NOT NULL, "course_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "lesson_participant_id_idx" ON "lessons" ("participant_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "lesson_course_id_idx" ON "lessons" ("course_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "audio_url" text, "from_participant_id" uuid NOT NULL, "to_participant_id" uuid NOT NULL, "lesson_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "messages_from_participant_id_idx" ON "messages" ("from_participant_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "messages_to_participant_id_idx" ON "messages" ("to_participant_id") `
        );
        await queryRunner.query(
            `CREATE INDEX "messages_lesson_id_idx" ON "messages" ("lesson_id") `
        );
        await queryRunner.query(
            `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "audio_url" text, "lesson_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "sessions_lesson_id_idx" ON "sessions" ("lesson_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "characters" ADD CONSTRAINT "FK_c6e648aeaab79e4213def02aba8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "participants" ADD CONSTRAINT "FK_eff57563c4eeb4d9a30e9b131bd" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "participants" ADD CONSTRAINT "FK_1427a77e06023c250ed3794a1ba" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "participants" ADD CONSTRAINT "FK_68b500b8ac26a3fd570bb044068" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lessons" ADD CONSTRAINT "FK_8acbae085d6527b8c28826db855" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "lessons" ADD CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ADD CONSTRAINT "FK_cb971c6e56668fab6b004b43afd" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ADD CONSTRAINT "FK_3b98fd2b3b4679bac4dc0a2976c" FOREIGN KEY ("from_participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" ADD CONSTRAINT "FK_b386b08ee654e1d2154c4c72854" FOREIGN KEY ("to_participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "sessions" ADD CONSTRAINT "FK_36fcb4c47cd68e624fd5911eda9" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "sessions" DROP CONSTRAINT "FK_36fcb4c47cd68e624fd5911eda9"`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" DROP CONSTRAINT "FK_b386b08ee654e1d2154c4c72854"`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" DROP CONSTRAINT "FK_3b98fd2b3b4679bac4dc0a2976c"`
        );
        await queryRunner.query(
            `ALTER TABLE "messages" DROP CONSTRAINT "FK_cb971c6e56668fab6b004b43afd"`
        );
        await queryRunner.query(
            `ALTER TABLE "lessons" DROP CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe"`
        );
        await queryRunner.query(
            `ALTER TABLE "lessons" DROP CONSTRAINT "FK_8acbae085d6527b8c28826db855"`
        );
        await queryRunner.query(
            `ALTER TABLE "participants" DROP CONSTRAINT "FK_68b500b8ac26a3fd570bb044068"`
        );
        await queryRunner.query(
            `ALTER TABLE "participants" DROP CONSTRAINT "FK_1427a77e06023c250ed3794a1ba"`
        );
        await queryRunner.query(
            `ALTER TABLE "participants" DROP CONSTRAINT "FK_eff57563c4eeb4d9a30e9b131bd"`
        );
        await queryRunner.query(
            `ALTER TABLE "characters" DROP CONSTRAINT "FK_c6e648aeaab79e4213def02aba8"`
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`
        );
        await queryRunner.query(`DROP INDEX "public"."sessions_lesson_id_idx"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "public"."messages_lesson_id_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."messages_to_participant_id_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."messages_from_participant_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP INDEX "public"."lesson_course_id_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."lesson_participant_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "lessons"`);
        await queryRunner.query(`DROP TYPE "public"."lesson_type_enum"`);
        await queryRunner.query(`DROP TABLE "participants"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP INDEX "public"."messages_user_id_idx"`);
        await queryRunner.query(`DROP TABLE "characters"`);
        await queryRunner.query(
            `DROP INDEX "public"."notifications_user_id_idx"`
        );
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "public"."users_has_mobile_idx"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_1c844df74e011d4b0694ad5b2c"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."users_referral_code_idx"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`
        );
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."auth_provider_enum"`);
    }
}
