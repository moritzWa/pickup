import { dataSource } from "src/core/infra/postgres";
import { Content, ContentType } from "src/core/infra/postgres/entities/Content";
import { success } from "src/core/logic";
import { contentRepo } from "src/modules/content/infra";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils";

const contentTTS = async () => {
    try {
        await dataSource.initialize();

        // const contentResponse = await contentRepo.filterContentThatNeedTTS();
        const contentResponse = success([
            {
                id: "mock-id",
                websiteUrl:
                    "https://www.thecrimson.com/article/2017/5/25/desai-commencement-ed/",
                content:
                    "This is a mock content for the Harvard Crimson article.",
                type: ContentType.ARTICLE,
                audioUrl: null,
            } as Content,
        ]);

        if (contentResponse.isFailure()) {
            Logger.error("Failed to fetch content:", contentResponse.error);
            return;
        }

        const contents = contentResponse.value.slice(0, 3); // Limit to 3 contents

        Logger.info(`Found ${contents.length} contents that need TTS`);

        for (const content of contents) {
            Logger.info(`Processing content: ${content.websiteUrl}`);
            const audioResponse = await AudioService.generate(
                content.content || ""
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
                    `Successfully processed content: ${content.websiteUrl}`
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
