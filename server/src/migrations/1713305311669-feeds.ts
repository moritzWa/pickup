import { MigrationInterface, QueryRunner } from "typeorm";

export class feeds1713305311669 implements MigrationInterface {
    name = "feeds1713305311669";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`CREATE TABLE "feed_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "content" text NOT NULL DEFAULT '', "num_likes" integer NOT NULL DEFAULT '0', "num_comments" integer NOT NULL DEFAULT '0', "provider" text NOT NULL, "contract_address" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_91d985d29dfb9db30f565391830" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE INDEX "feed_posts_contract_address_provider_idx" ON "feed_posts" ("contract_address", "provider") `);
        // await queryRunner.query(`CREATE TABLE "feed_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "feed_post_id" uuid, "feed_comment_id" uuid, "user_id" uuid NOT NULL, "content" text NOT NULL DEFAULT '', "num_likes" integer NOT NULL DEFAULT '0', "num_comments" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_1bf5d40b434d0ad53853845284c" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE INDEX "feed_comments_feed_post_id_idx" ON "feed_comments" ("feed_post_id") `);
        // await queryRunner.query(`CREATE INDEX "feed_comments_feed_post_id_idx" ON "feed_comments" ("feed_post_id") `);
        // await queryRunner.query(`CREATE INDEX "feed_comments_feed_comment_id_idx" ON "feed_comments" ("feed_comment_id") `);
        // await queryRunner.query(`CREATE INDEX "feed_comments_feed_comment_id_idx" ON "feed_comments" ("feed_comment_id") `);
        // await queryRunner.query(`CREATE TABLE "feed_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "feed_post_id" uuid, "feed_comment_id" uuid, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "feed_likes_id_user_id_idx" UNIQUE ("id", "feed_post_id"), CONSTRAINT "PK_cc8da4d504330fc9a28b227976c" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE INDEX "feed_likes_feed_post_id_idx" ON "feed_likes" ("feed_post_id") `);
        // await queryRunner.query(`CREATE INDEX "feed_likes_feed_post_id_idx" ON "feed_likes" ("feed_post_id") `);
        // await queryRunner.query(`CREATE INDEX "feed_likes_feed_comment_id_idx" ON "feed_likes" ("feed_comment_id") `);
        // await queryRunner.query(`CREATE INDEX "feed_likes_feed_comment_id_idx" ON "feed_likes" ("feed_comment_id") `);
        // await queryRunner.query(`ALTER TABLE "feed_posts" ADD CONSTRAINT "FK_0e637a1174ae0deea26a50c2c49" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "feed_comments" ADD CONSTRAINT "FK_4aee1404a4bde8126e0e9697fb2" FOREIGN KEY ("feed_post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "feed_comments" ADD CONSTRAINT "FK_3cc1262764a5c4304e3854f675a" FOREIGN KEY ("feed_comment_id") REFERENCES "feed_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "feed_comments" ADD CONSTRAINT "FK_4b189a043b35397dc04273e8d21" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "feed_likes" ADD CONSTRAINT "FK_8bed6765fe9ce24e75df4a78ddc" FOREIGN KEY ("feed_post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "feed_likes" ADD CONSTRAINT "FK_1b2cbb773813b2f9a5d67b0d669" FOREIGN KEY ("feed_comment_id") REFERENCES "feed_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "feed_likes" ADD CONSTRAINT "FK_641857fd1b2550b4f848c76069b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "feed_likes" DROP CONSTRAINT "FK_641857fd1b2550b4f848c76069b"`);
        // await queryRunner.query(`ALTER TABLE "feed_likes" DROP CONSTRAINT "FK_1b2cbb773813b2f9a5d67b0d669"`);
        // await queryRunner.query(`ALTER TABLE "feed_likes" DROP CONSTRAINT "FK_8bed6765fe9ce24e75df4a78ddc"`);
        // await queryRunner.query(`ALTER TABLE "feed_comments" DROP CONSTRAINT "FK_4b189a043b35397dc04273e8d21"`);
        // await queryRunner.query(`ALTER TABLE "feed_comments" DROP CONSTRAINT "FK_3cc1262764a5c4304e3854f675a"`);
        // await queryRunner.query(`ALTER TABLE "feed_comments" DROP CONSTRAINT "FK_4aee1404a4bde8126e0e9697fb2"`);
        // await queryRunner.query(`ALTER TABLE "feed_posts" DROP CONSTRAINT "FK_0e637a1174ae0deea26a50c2c49"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_likes_feed_comment_id_idx"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_likes_feed_comment_id_idx"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_likes_feed_post_id_idx"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_likes_feed_post_id_idx"`);
        // await queryRunner.query(`DROP TABLE "feed_likes"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_comments_feed_comment_id_idx"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_comments_feed_comment_id_idx"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_comments_feed_post_id_idx"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_comments_feed_post_id_idx"`);
        // await queryRunner.query(`DROP TABLE "feed_comments"`);
        // await queryRunner.query(`DROP INDEX "public"."feed_posts_contract_address_provider_idx"`);
        // await queryRunner.query(`DROP TABLE "feed_posts"`);
    }
}
