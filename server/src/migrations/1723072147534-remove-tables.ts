import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTables1723072147534 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // remove characters table
        await queryRunner.query(`DROP TABLE characters CASCADE`);
        await queryRunner.query(`DROP TABLE course_progress CASCADE`);
        await queryRunner.query(`DROP TABLE courses CASCADE`);
        await queryRunner.query(`DROP TABLE lesson_progress CASCADE`);
        await queryRunner.query(`DROP TABLE lessons CASCADE`);
        await queryRunner.query(`DROP TABLE participants CASCADE`);
        await queryRunner.query(`DROP TABLE messages CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
