import { MigrationInterface, QueryRunner } from "typeorm";

export class Curius1722830410400 implements MigrationInterface {
    name = 'Curius1722830410400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" DROP CONSTRAINT "FK_link"`);
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" ADD "embedding" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" ADD CONSTRAINT "FK_a955b0d20279c4413f9aa7b9d57" FOREIGN KEY ("linkId") REFERENCES "curius_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" DROP CONSTRAINT "FK_a955b0d20279c4413f9aa7b9d57"`);
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" ADD "embedding" vector NOT NULL`);
        await queryRunner.query(`ALTER TABLE "curius_link_chunks" ADD CONSTRAINT "FK_link" FOREIGN KEY ("linkId") REFERENCES "curius_links"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
