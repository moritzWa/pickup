import { contentChunkRepo, contentRepo } from "src/modules/content/infra";
import {
    _convertToAudio,
    _embedContent,
    _markContentProcessed,
    _transcribeContent,
} from "src/jobs/inngest/functions/processContent";
import { connect } from "src/core/infra/postgres";
import { parallel } from "radash";
import { failure, success, UnexpectedError } from "src/core/logic";
import { openai } from "src/utils";
import * as pgvector from "pgvector/pg";
import { chunk } from "lodash";

const processContent = async (contentId: string) => {
    try {
        const chunks = await _transcribeContent(contentId);

        await _embedContent(contentId, chunks);

        await _convertToAudio(contentId);

        await _markContentProcessed(contentId);

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _embedContentV2 = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    const content = contentResponse.value;

    if (!content.summary) {
        console.log(`[no summary for ${content.title}]`);
        return Promise.resolve();
    }
    const embeddingResponse = await openai.embeddings.create(
        `Title: ${content.title}. Summary: ${content.summary || ""}`
    );

    if (embeddingResponse.isFailure()) {
        throw embeddingResponse.error;
    }

    const embedding = embeddingResponse.value;

    await contentRepo.update(content.id, {
        embedding: pgvector.toSql(embedding),
    });

    return content.id;
};

const processContentV2 = async (contentId: string) => {
    try {
        await _embedContentV2(contentId);

        await _markContentProcessed(contentId);

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const run = async () => {
    const contentResponse = await contentRepo.find({
        where: {
            isProcessed: false,
        },
        select: { id: true },
        // take: 250,
    });

    const content = contentResponse.value;

    console.time("processContent");

    // chunks of 10
    const results = chunk(content, 10);

    console.time("processContent");

    let completed = 0;
    for (let i = 0; i < results.length; i++) {
        // every 100, log completion out of total
        if (completed % 50 === 0) {
            console.log(`completed ${completed} of ${content.length}`);
        }

        const chunk = results[i];

        await Promise.all(chunk.map(async (c) => processContentV2(c.id)));

        completed += chunk.length;
    }

    console.timeEnd("processContent");

    debugger;
};

// if main file, run it
void connect()
    .then(run)
    .finally(() => process.exit(1));
