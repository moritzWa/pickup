import { MigrationInterface, QueryRunner } from "typeorm";

export class AccountSubTypes1722664282882 implements MigrationInterface {
    name = 'AccountSubTypes1722664282882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "curius_users" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "userLink" character varying NOT NULL, "lastOnline" TIMESTAMP NOT NULL, "link_id" integer, CONSTRAINT "PK_1b8239033cdd2c309b0d89dc395" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "curius_comments" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "parentId" integer, "text" character varying NOT NULL, "createdDate" TIMESTAMP NOT NULL, "modifiedDate" TIMESTAMP NOT NULL, "user_id" integer, "parent_id" integer, "link_id" integer, CONSTRAINT "PK_d879eb5994ae702184affc0657f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "curius_mentions" ("id" SERIAL NOT NULL, "fromUid" integer NOT NULL, "toUid" integer NOT NULL, "createdDate" TIMESTAMP NOT NULL, "link_id" integer, "user_id" integer, "highlight_id" integer, CONSTRAINT "PK_36f48505d944f4d75cab0e3bc5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "curius_highlights" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "linkId" integer NOT NULL, "highlight" character varying NOT NULL, "createdDate" TIMESTAMP NOT NULL, "position" jsonb NOT NULL, "verified" boolean, "leftContext" character varying NOT NULL, "rightContext" character varying NOT NULL, "rawHighlight" character varying NOT NULL, "user_id" integer, "link_id" integer, "comment_id" integer, CONSTRAINT "REL_41329cb729cffe0ddec89a6aaa" UNIQUE ("comment_id"), CONSTRAINT "PK_880e1b8e90c6fd4902a1f3db1f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "curius_links" ("id" SERIAL NOT NULL, "link" character varying NOT NULL, "title" character varying NOT NULL, "favorite" boolean NOT NULL, "snippet" character varying NOT NULL, "metadata" jsonb, "createdDate" TIMESTAMP, "modifiedDate" TIMESTAMP NOT NULL, "lastCrawled" TIMESTAMP, "userIds" integer array NOT NULL, "readCount" integer NOT NULL, CONSTRAINT "PK_3d770cdcf7bad4c3c6528404ee2" PRIMARY KEY ("id"))`);
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
        await queryRunner.query(`DROP TABLE "curius_links"`);
        await queryRunner.query(`DROP TABLE "curius_highlights"`);
        await queryRunner.query(`DROP TABLE "curius_mentions"`);
        await queryRunner.query(`DROP TABLE "curius_comments"`);
        await queryRunner.query(`DROP TABLE "curius_users"`);
    }

}
