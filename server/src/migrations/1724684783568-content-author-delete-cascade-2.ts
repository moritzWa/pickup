import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuthorContentAuthorFK1234567890123
    implements MigrationInterface
{
    name = "UpdateAuthorContentAuthorFK1234567890123";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing foreign key constraint if it exists
        await queryRunner.query(
            `ALTER TABLE "content_authors" DROP CONSTRAINT IF EXISTS "FK_content_authors_author_id"`
        );

        // Add the new foreign key constraint with ON DELETE CASCADE
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_content_authors_author_id" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the new foreign key constraint
        await queryRunner.query(
            `ALTER TABLE "content_authors" DROP CONSTRAINT "FK_content_authors_author_id"`
        );

        // Add back the original foreign key constraint (assuming it was NO ACTION before)
        await queryRunner.query(
            `ALTER TABLE "content_authors" ADD CONSTRAINT "FK_content_authors_author_id" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}
