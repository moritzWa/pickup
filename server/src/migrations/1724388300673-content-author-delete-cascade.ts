import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateContentAuthorFK1723675580018 implements MigrationInterface {
    name = "UpdateContentAuthorFK1723675580018";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing foreign key constraint
        await queryRunner.query(
            `ALTER TABLE "content_authors" DROP CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89"`
        );

        // Add the new foreign key constraint with ON DELETE CASCADE
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the new foreign key constraint
        await queryRunner.query(
            `ALTER TABLE "content_authors" DROP CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89"`
        );

        // Add the original foreign key constraint
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_d6a6dc0025622bd0b987a9fee89" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}
