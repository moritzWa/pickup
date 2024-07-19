import { MigrationInterface, QueryRunner } from "typeorm";

export class quoteUpdates1706756942989 implements MigrationInterface {
    name = "quoteUpdates1706756942989";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" DROP CONSTRAINT "FK_d2edf1bd53f8a1ba739fe060318"`
        );
        await queryRunner.query(`DROP INDEX "public"."swaps_quote_idx"`);
        await queryRunner.query(`ALTER TABLE "swaps" DROP COLUMN "quote_id"`);
        // drop the quotes table
        await queryRunner.query(`DROP TABLE "quotes"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD "quote_id" uuid NOT NULL`
        );
        await queryRunner.query(
            `CREATE INDEX "swaps_quote_idx" ON "swaps" ("quote_id") `
        );
        await queryRunner.query(
            `ALTER TABLE "swaps" ADD CONSTRAINT "FK_d2edf1bd53f8a1ba739fe060318" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
        );
    }
}
