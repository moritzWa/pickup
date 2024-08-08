import { MigrationInterface, QueryRunner } from "typeorm";

export class UserQueue1723095592412 implements MigrationInterface {
    name = "UserQueue1723095592412";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD "current_queue_id" uuid`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_33bfeb7a2c68fef6c92fe5b77e8" FOREIGN KEY ("current_queue_id") REFERENCES "queue"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
