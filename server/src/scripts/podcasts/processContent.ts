import { contentChunkRepo, contentRepo } from "src/modules/content/infra";
import { AudioService } from "src/shared/audioService";
import axios from "axios";
import { TranscribeService } from "src/modules/content/services/transcribeService";
import { ContentService } from "src/modules/content/services/contentService";
import { ContentChunk } from "src/core/infra/postgres/entities";
import { v4 as uuidv4 } from "uuid";
import { parseBuffer, parseFile } from "music-metadata";
import {
    _convertToAudio,
    _embedContent,
    _markContentProcessed,
    _transcribeContent,
} from "src/jobs/inngest/functions/processContent";
import { connect } from "src/core/infra/postgres";

const processContent = async (contentId: string) => {
    await _transcribeContent(contentId);

    await _embedContent(contentId);

    await _convertToAudio(contentId);

    await _markContentProcessed(contentId);

    return Promise.resolve();
};

const run = async () => {
    const contentResponse = await contentRepo.find({
        where: {
            id: "fd31ac8c-138c-40b0-a65a-2c9d28854298",
            // isProcessed: false,
        },
        take: 1,
    });

    const content = contentResponse.value;

    for (const c of content) {
        await processContent(c.id);
    }
};

// if main file, run it
void connect()
    .then(run)
    .finally(() => process.exit(1));
