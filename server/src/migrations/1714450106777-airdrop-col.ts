import { MigrationInterface, QueryRunner } from "typeorm";

export class airdropCol1714450106777 implements MigrationInterface {
    name = "airdropCol1714450106777";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrops" ADD "airdrop_pubkey" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "airdrops" DROP COLUMN "airdrop_pubkey"`
        );
    }
}
