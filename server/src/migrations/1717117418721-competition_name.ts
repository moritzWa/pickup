import { MigrationInterface, QueryRunner } from "typeorm";

export class competitionName1717117418721 implements MigrationInterface {
    name = 'competitionName1717117418721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "competitions" ADD "name" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "competitions" DROP COLUMN "name"`);
    }

}
