import { dataSource } from "src/core/infra/postgres";
import { contentRepo } from "src/modules/content/infra";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils";

const slugify = (str: string) => {
    str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
    str = str.toLowerCase(); // convert string to lowercase
    str = str
        .replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/-+/g, "-"); // remove consecutive hyphens
    return str;
};

const contentTTS = async () => {
    try {
        await dataSource.initialize();

        // const contentResponse = await contentRepo.filterContentThatNeedTTS();
        const contentResponse = await contentRepo.getSingleTestContent();

        if (contentResponse.isFailure()) {
            Logger.error("Failed to fetch content:", contentResponse.error);
            return;
        }

        const contents = contentResponse.value.slice(0, 3); // Limit to 3 contents

        Logger.info(`Found ${contents.length} contents that need TTS`);

        for (const content of contents) {
            const contentTitleSlug = slugify(content.title);

            Logger.info(`Processing content: ${content.websiteUrl}`);
            const audioResponse = await AudioService.generate(
                content.content || "",
                contentTitleSlug || ""
            );

            if (audioResponse.isFailure()) {
                Logger.error(
                    `Failed to generate audio for content ${content.websiteUrl}:`,
                    audioResponse.error
                );
                continue;
            }

            const updateResponse = await contentRepo.update(content.id, {
                audioUrl: audioResponse.value.url,
            });

            if (updateResponse.isFailure()) {
                Logger.error(
                    `Failed to update content ${content.websiteUrl} with audio URL:`,
                    updateResponse.error
                );
            } else {
                Logger.info(
                    `Successfully processed content for ${content.websiteUrl}. Audio URL: ${audioResponse.value.url}`
                );
            }
        }
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

contentTTS().catch(console.error);
