import { dataSource } from "src/core/infra/postgres";

const checkEmbeddingColumnType = async () => {
    await dataSource.initialize();

    try {
        // Query to get the data type of the "embedding" column
        const result = await dataSource.query(`
            SELECT c.column_name, t.typname AS data_type
            FROM information_schema.columns c
            JOIN pg_type t ON c.udt_name = t.typname
            WHERE c.table_name = 'curius_links' AND c.column_name = 'embedding';
        `);

        if (result.length > 0) {
            const { column_name, data_type } = result[0];
            console.log(`Column: ${column_name}, Data Type: ${data_type}`);
        } else {
            console.log("Embedding column not found in curius_links table.");
        }
    } catch (error) {
        console.error("Error querying the embedding column:", error);
    } finally {
        await dataSource.destroy();
    }
};

checkEmbeddingColumnType().catch(console.error);
