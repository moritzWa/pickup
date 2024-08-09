import { dataSource } from "src/core/infra/postgres";
import { curiusLinkRepo } from "src/modules/curius/infra";
import { Logger } from "src/utils";

const filterBestCuriusLinks = async () => {
    try {
        // Initialize the database connection
        await dataSource.initialize();

        const linksResult = await curiusLinkRepo.filterBestLinks(2000);
        if (linksResult.isFailure()) {
            Logger.error(
                "Failed to filter best Curius links",
                linksResult.error
            );
            return;
        }

        const links = linksResult.value;
        Logger.info(`Found ${links.length} best Curius links`);
        // Additional processing or logging can be done here
    } catch (error) {
        Logger.error("Error in filterBestCuriusLinks", error);
    } finally {
        // Close the database connection
        await dataSource.destroy();
    }
};

filterBestCuriusLinks();
