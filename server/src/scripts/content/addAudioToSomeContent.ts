import { dataSource } from "src/core/infra/postgres";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils/logger";
import { contentRepo } from "../../modules/content/infra";

const contentUrls = [
    "https://blogs.chapman.edu/scst/2015/05/25/the-exquisite-balancing-act-taubes/",
    // Add more URLs here
];

async function addContentAudio() {
    try {
        await dataSource.initialize();

        for (const url of contentUrls) {
            Logger.info(`Processing content for URL: ${url}`);

            // Find content in the database
            const contentResponse = await contentRepo.find({
                where: { websiteUrl: url },
                take: 1,
            });

            if (contentResponse.isFailure()) {
                Logger.error(`Failed to find content for URL: ${url}`);
                continue;
            }

            const contents = contentResponse.value;
            if (contents.length === 0) {
                Logger.error(`No content found for URL: ${url}`);
                continue;
            }

            const content = contents[0];

            // Check if audio already exists
            if (content.audioUrl) {
                Logger.info(`Audio already exists for URL: ${url}`);
                Logger.info(`Audio URL: ${content.audioUrl}`);
                continue;
            }

            // Generate audio
            const audioResponse = await AudioService.generate(
                content.content || "",
                content.title
            );
            if (audioResponse.isFailure()) {
                Logger.error(
                    `Failed to generate audio for URL: ${url}`,
                    audioResponse.error
                );
                continue;
            }

            const { url: audioUrl, lengthMs } = audioResponse.value;

            // logg the audio url
            Logger.info(`Audio URL: ${audioUrl}`);

            // Update content with audio URL and length
            const updateResponse = await contentRepo.update(content.id, {
                audioUrl,
                lengthMs,
            });

            if (updateResponse.isFailure()) {
                Logger.error(
                    `Failed to update content with audio for URL: ${url}`,
                    updateResponse.error
                );
            } else {
                Logger.info(`Successfully added audio for URL: ${url}`);
            }
        }

        Logger.info("Finished processing all URLs");
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

addContentAudio().catch(console.error);
