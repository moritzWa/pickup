import { MigrationInterface, QueryRunner } from "typeorm";

export class Curius1722716284213 implements MigrationInterface {
    name = 'Curius1722716284213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_mentions" DROP CONSTRAINT "FK_6d585c51a49bedf467d2c64607b"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" DROP CONSTRAINT "FK_ed072f7665a77cadb7c5e1aad8c"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP CONSTRAINT "FK_c9ad3b687d854e4e09b0e772038"`);
        await queryRunner.query(`ALTER TABLE "curius_users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "curius_users_id_seq"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" DROP CONSTRAINT "FK_41329cb729cffe0ddec89a6aaaa"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP CONSTRAINT "FK_0225da4a25ed023cdec1a8ea683"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "curius_comments_id_seq"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "curius_mentions_id_seq"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" DROP CONSTRAINT "FK_a9929b995a080ddd8c170c632c7"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "curius_highlights_id_seq"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" DROP CONSTRAINT "FK_526e89d9e7883dea3e9ffd15c18"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" DROP CONSTRAINT "FK_c2f0d789390ad02b3fddafefb19"`);
        await queryRunner.query(`ALTER TABLE "curius_users" DROP CONSTRAINT "FK_1abd98bb2551d416561567dc231"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP CONSTRAINT "FK_38194902d91d2e4dc257fee0eae"`);
        await queryRunner.query(`ALTER TABLE "curius_links" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "curius_links_id_seq"`);
        await queryRunner.query(`ALTER TABLE "curius_users" ADD CONSTRAINT "FK_1abd98bb2551d416561567dc231" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD CONSTRAINT "FK_c9ad3b687d854e4e09b0e772038" FOREIGN KEY ("user_id") REFERENCES "curius_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD CONSTRAINT "FK_0225da4a25ed023cdec1a8ea683" FOREIGN KEY ("parent_id") REFERENCES "curius_comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD CONSTRAINT "FK_38194902d91d2e4dc257fee0eae" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ADD CONSTRAINT "FK_526e89d9e7883dea3e9ffd15c18" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ADD CONSTRAINT "FK_6d585c51a49bedf467d2c64607b" FOREIGN KEY ("user_id") REFERENCES "curius_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ADD CONSTRAINT "FK_a9929b995a080ddd8c170c632c7" FOREIGN KEY ("highlight_id") REFERENCES "curius_highlights"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ADD CONSTRAINT "FK_ed072f7665a77cadb7c5e1aad8c" FOREIGN KEY ("user_id") REFERENCES "curius_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ADD CONSTRAINT "FK_c2f0d789390ad02b3fddafefb19" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ADD CONSTRAINT "FK_41329cb729cffe0ddec89a6aaaa" FOREIGN KEY ("comment_id") REFERENCES "curius_comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_highlights" DROP CONSTRAINT "FK_41329cb729cffe0ddec89a6aaaa"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" DROP CONSTRAINT "FK_c2f0d789390ad02b3fddafefb19"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" DROP CONSTRAINT "FK_ed072f7665a77cadb7c5e1aad8c"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" DROP CONSTRAINT "FK_a9929b995a080ddd8c170c632c7"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" DROP CONSTRAINT "FK_6d585c51a49bedf467d2c64607b"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" DROP CONSTRAINT "FK_526e89d9e7883dea3e9ffd15c18"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP CONSTRAINT "FK_38194902d91d2e4dc257fee0eae"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP CONSTRAINT "FK_0225da4a25ed023cdec1a8ea683"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" DROP CONSTRAINT "FK_c9ad3b687d854e4e09b0e772038"`);
        await queryRunner.query(`ALTER TABLE "curius_users" DROP CONSTRAINT "FK_1abd98bb2551d416561567dc231"`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "curius_links_id_seq" OWNED BY "curius_links"."id"`);
        await queryRunner.query(`ALTER TABLE "curius_links" ALTER COLUMN "id" SET DEFAULT nextval('"curius_links_id_seq"')`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD CONSTRAINT "FK_38194902d91d2e4dc257fee0eae" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_users" ADD CONSTRAINT "FK_1abd98bb2551d416561567dc231" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ADD CONSTRAINT "FK_c2f0d789390ad02b3fddafefb19" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ADD CONSTRAINT "FK_526e89d9e7883dea3e9ffd15c18" FOREIGN KEY ("link_id") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "curius_highlights_id_seq" OWNED BY "curius_highlights"."id"`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ALTER COLUMN "id" SET DEFAULT nextval('"curius_highlights_id_seq"')`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ADD CONSTRAINT "FK_a9929b995a080ddd8c170c632c7" FOREIGN KEY ("highlight_id") REFERENCES "curius_highlights"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "curius_mentions_id_seq" OWNED BY "curius_mentions"."id"`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ALTER COLUMN "id" SET DEFAULT nextval('"curius_mentions_id_seq"')`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "curius_comments_id_seq" OWNED BY "curius_comments"."id"`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ALTER COLUMN "id" SET DEFAULT nextval('"curius_comments_id_seq"')`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD CONSTRAINT "FK_0225da4a25ed023cdec1a8ea683" FOREIGN KEY ("parent_id") REFERENCES "curius_comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ADD CONSTRAINT "FK_41329cb729cffe0ddec89a6aaaa" FOREIGN KEY ("comment_id") REFERENCES "curius_comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "curius_users_id_seq" OWNED BY "curius_users"."id"`);
        await queryRunner.query(`ALTER TABLE "curius_users" ALTER COLUMN "id" SET DEFAULT nextval('"curius_users_id_seq"')`);
        await queryRunner.query(`ALTER TABLE "curius_comments" ADD CONSTRAINT "FK_c9ad3b687d854e4e09b0e772038" FOREIGN KEY ("user_id") REFERENCES "curius_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_highlights" ADD CONSTRAINT "FK_ed072f7665a77cadb7c5e1aad8c" FOREIGN KEY ("user_id") REFERENCES "curius_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curius_mentions" ADD CONSTRAINT "FK_6d585c51a49bedf467d2c64607b" FOREIGN KEY ("user_id") REFERENCES "curius_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
