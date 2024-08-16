import { url } from "inspector";
import { keyBy } from "lodash";
import { Client } from "pg";
import { config } from "src/config";
import { URL } from "url";

console.log(config.env);

const parsePostgresUrlToParams = (urlString: string) => {
    const url = new URL(urlString);

    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
        throw new Error("Invalid protocol; expected 'postgres:'");
    }

    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port || "5432"; // Default to 5432 if port is not specified
    const database = url.pathname.slice(1); // Remove the leading '/'

    return {
        url: urlString,
        user,
        password,
        host,
        port: parseInt(port, 10),
        database,
    };
};

const local = parsePostgresUrlToParams(process.env.POSTGRES_URI || "");
const prod = parsePostgresUrlToParams(process.env.PROD_POSTGRES_URI || "");

// Connect to local and production databases
const localClient = new Client(local);

const productionClient = new Client({
    ...prod,
    ssl: true,
});

async function syncDatabases() {
    try {
        await localClient.connect();
        await productionClient.connect();

        // Fetch data from local
        const localData = await localClient.query(
            "SELECT * FROM content WHERE length_ms > 0 and audio_url is not null"
        );

        // Fetch data from production
        const productionData = await productionClient.query(
            "SELECT * FROM content WHERE (length_ms is null or length_ms = 0) and audio_url is not null"
        );

        debugger;

        const localRows = localData.rows ?? [];
        const prodRows = productionData.rows ?? [];

        const rowByRefId = keyBy(localRows, (r) => r.reference_id);

        let count = 0;

        console.log(`syncing ${prodRows.length} rows with local`);

        for (const row of prodRows) {
            const localData = rowByRefId[row.reference_id];

            if (!localData) {
                continue;
            }

            console.log(
                `[updating ${row.reference_id} to ${localData.length_ms}]`
            );

            // Update the production database with the local data
            await productionClient.query(
                `UPDATE content SET length_ms = $1 WHERE id = $2`,
                [localData.length_ms, row.id]
            );

            count += 1;

            // every 50, log
            if (count % 50 === 0) {
                console.log(
                    `completed ${count} of ${productionData.rows.length}`
                );
            }
        }

        debugger;
    } catch (error) {
        console.error("Error syncing databases:", error);
    } finally {
        await localClient.end();
        await productionClient.end();
    }
}

void syncDatabases();
