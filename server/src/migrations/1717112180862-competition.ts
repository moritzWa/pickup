import { MigrationInterface, QueryRunner } from "typeorm";

export class competition1717112180862 implements MigrationInterface {
    name = 'competition1717112180862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "competitions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token1_id" uuid NOT NULL, "token2_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_ef273910798c3a542b475e75c7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "competitions" ADD CONSTRAINT "FK_d4126cb7775c920adf338136fd4" FOREIGN KEY ("token1_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "competitions" ADD CONSTRAINT "FK_602771ea137af8ede2b0bb46da3" FOREIGN KEY ("token2_id") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "competitions" DROP CONSTRAINT "FK_602771ea137af8ede2b0bb46da3"`);
        await queryRunner.query(`ALTER TABLE "competitions" DROP CONSTRAINT "FK_d4126cb7775c920adf338136fd4"`);
        await queryRunner.query(`DROP TABLE "competitions"`);
    }

}
