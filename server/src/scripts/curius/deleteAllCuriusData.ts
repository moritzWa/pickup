import { dataSource } from "src/core/infra/postgres";

const deleteAllCuriusData = async () => {
    // Safety check: Ensure we're only running on localhost
    const dbHost = process.env.POSTGRES_URI?.split("@")[1]?.split(":")[0];
    if (dbHost !== "localhost") {
        console.error(
            "Error: This script can only be run on a localhost database."
        );
        process.exit(1);
    }

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
