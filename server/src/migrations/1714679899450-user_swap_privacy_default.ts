import { MigrationInterface, QueryRunner } from "typeorm";

export class userSwapPrivacyDefault1714679899450 implements MigrationInterface {
    name = 'userSwapPrivacyDefault1714679899450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "swap_privacy_default" "public"."swap_privacy_enum" NOT NULL DEFAULT 'public'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "swap_privacy_default"`);
    }

}
