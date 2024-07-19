import { MigrationInterface, QueryRunner } from "typeorm";

export class categoryUnique1715887377825 implements MigrationInterface {
    name = 'categoryUnique1715887377825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."category_idx"`);
        await queryRunner.query(`CREATE INDEX "category_entry_idx" ON "category_entries" ("category") `);
        await queryRunner.query(`ALTER TABLE "category_entries" ADD CONSTRAINT "category_entry_token_idx" UNIQUE ("token_id", "category")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category_entries" DROP CONSTRAINT "category_entry_token_idx"`);
        await queryRunner.query(`DROP INDEX "public"."category_entry_idx"`);
        await queryRunner.query(`CREATE INDEX "category_idx" ON "category_entries" ("category") `);
    }

}
