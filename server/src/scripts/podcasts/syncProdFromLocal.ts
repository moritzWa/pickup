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
            "SELECT * FROM content WHERE type = 'podcast'"
        );

        // Fetch data from production
        const productionData = await productionClient.query(
            "SELECT * FROM content WHERE type = 'podcast'"
        );

        debugger;

        const localRows = localData.rows ?? [];
        const prodRows = productionData.rows ?? [];

        const prodRowIds = new Set(prodRows.map((p) => p.reference_id));

        const localRowIds = localRows.map((l) => l.reference_id);
        const localRowsNotInProd = localRows.filter(
            (l) => !prodRowIds.has(l.reference_id)
        );

        const rowByRefId = keyBy(localRows, (r) => r.reference_id);

        let count = 0;

        console.log(`syncing ${prodRows.length} rows with local`);

        const insertPromises: any[] = [];

        // for (const localRow of localRowsNotInProd) {
        //     // add to production
        //     console.log(`[adding ${localRow.reference_id} to production]`);

        //     const keys = Object.keys(localRow).sort();

        //     const insertExpression = keys // get all keys
        //         .map((k, i) => `$${i + 1}`) // map to $1, $2, $3, etc
        //         .join(", "); // join with commas

        //     const expression = `INSERT INTO content (${keys
        //         .map((k) => k)
        //         .join(", ")}) VALUES (${insertExpression})`;

        //     const values = keys.map((key) => localRow[key]);

        //     // make an insert statement of ALL local row fields spilled to prod
        //     const result = productionClient.query(expression, values);

        //     insertPromises.push(result);
        // }

        await Promise.all(insertPromises);

        debugger;

        const promises: any[] = [];

        for (const row of prodRows) {
            const localData = rowByRefId[row.reference_id];

            if (!localData) {
                continue;
            }

            console.log(
                `[updating ${row.reference_id} to ${localData.length_ms}]`
            );

            if (localData.length_ms && localData.embedding) {
                // Update the production database with the local data
                promises.push(
                    productionClient.query(
                        `UPDATE content SET length_ms = $1, embedding = $2 WHERE id = $3`,
                        [localData.length_ms, localData.embedding, row.id]
                    )
                );
            }

            count += 1;

            // every 50, log
            if (count % 50 === 0) {
                console.log(
                    `completed ${count} of ${productionData.rows.length}`
                );
            }
        }

        const rowsNotInProd = await Promise.all(promises);

        debugger;
    } catch (error) {
        console.error("Error syncing databases:", error);
    } finally {
        await localClient.end();
        await productionClient.end();
    }
}

void syncDatabases();
