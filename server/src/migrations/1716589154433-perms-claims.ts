import { MigrationInterface, QueryRunner } from "typeorm";

export class permsClaims1716589154433 implements MigrationInterface {
    name = "permsClaims1716589154433";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD "claim_code" text NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD CONSTRAINT "UQ_7c858df18c01922f5f20c6590b2" UNIQUE ("claim_code")`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP CONSTRAINT "FK_5e4e5053802b77a34b301ccbf77"`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP CONSTRAINT "token_permissions_token_user_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ALTER COLUMN "user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD CONSTRAINT "token_permissions_token_user_idx" UNIQUE ("token_id", "user_id")`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD CONSTRAINT "FK_5e4e5053802b77a34b301ccbf77" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP CONSTRAINT "FK_5e4e5053802b77a34b301ccbf77"`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP CONSTRAINT "token_permissions_token_user_idx"`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ALTER COLUMN "user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD CONSTRAINT "token_permissions_token_user_idx" UNIQUE ("token_id", "user_id")`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" ADD CONSTRAINT "FK_5e4e5053802b77a34b301ccbf77" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP CONSTRAINT "UQ_7c858df18c01922f5f20c6590b2"`
        );
        await queryRunner.query(
            `ALTER TABLE "token_permissions" DROP COLUMN "claim_code"`
        );
    }
}
