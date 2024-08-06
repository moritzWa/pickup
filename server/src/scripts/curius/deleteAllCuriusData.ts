import { dataSource } from "src/core/infra/postgres";

const deleteAllCuriusData = async () => {
    await dataSource.initialize();

    console.log("Deleting all Curius data...");

    await dataSource.query('TRUNCATE TABLE "curius_comments" CASCADE');
    await dataSource.query('TRUNCATE TABLE "curius_highlights" CASCADE');
    await dataSource.query('TRUNCATE TABLE "curius_mentions" CASCADE');
    await dataSource.query('TRUNCATE TABLE "curius_users" CASCADE');
    await dataSource.query('TRUNCATE TABLE "curius_links" CASCADE');
    await dataSource.query('TRUNCATE TABLE "curius_link_chunks" CASCADE');

    console.log("All Curius data deleted.");

    await dataSource.destroy();
};

deleteAllCuriusData().catch(console.error);
