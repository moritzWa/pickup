import { dataSource } from "src/core/infra/postgres";
import {
    CuriusComment,
    CuriusHighlight,
    CuriusLink,
    CuriusMention,
    CuriusUser,
} from "src/core/infra/postgres/entities/";
import {
    curiusCommentRepo,
    curiusHighlightRepo,
    curiusLinkRepo,
    curiusMentionRepo,
    curiusUserRepo,
} from "src/modules/curius/infra";
import { LinkViewResponse } from "./types";

const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mjk1NywiaWF0IjoxNzE1NTUwMzA2LCJleHAiOjE3NDY5OTk5MDZ9.tjIhVHbkf_lc3st0hdLdoUTDfN32VaQPeWYGRKlNGNc";
const headers = {
    Authorization: `Bearer ${token}`,
};

const BATCH_SIZE = 75;

const scrapeCuriusLinks = async () => {
    await dataSource.initialize();

    const startLink = 55998;
    const numLinks = 40000;
    // latest as of 2024-08-03 is 127456
    // note we haven't fetched the metadata for 0-35863

    const avgTimePerLink = 60.06655;

    console.log(
        `Scraping ${numLinks} Curius Links in batches of ${BATCH_SIZE}...`,
        `This will take ~${(numLinks * avgTimePerLink) / 1000} minutes`
    );
    const totalStartTime = Date.now();
    let totalProcessedLinks = 0;

    for (
        let batchStart = startLink;
        batchStart < startLink + numLinks;
        batchStart += BATCH_SIZE
    ) {
        const batchEnd = Math.min(
            batchStart + BATCH_SIZE,
            startLink + numLinks
        );
        const batchStartTime = Date.now();

        const batchPromises: Promise<LinkViewResponse>[] = [];

        for (let i = batchStart; i < batchEnd; i++) {
            const linkViewUrl = `https://curius.app/api/linkview/${i}`;
            batchPromises.push(
                fetch(linkViewUrl, { headers })
                    .then((response) => response.json())
                    .catch((error) => {
                        console.error(`Error fetching link ${i}:`, error);
                        return null;
                    })
            );
        }

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(
            (result): result is LinkViewResponse => result !== null
        );

        totalProcessedLinks += validResults.length;
        const progressPercentage = (
            (totalProcessedLinks / numLinks) *
            100
        ).toFixed(2);

        console.log(
            `Fetched ${validResults.length} links. Progress: ${progressPercentage}%. Saving to database...`
        );

        const saveStartTime = Date.now();
        await Promise.all(validResults.map((data) => saveCuriusData(data)));
        const saveEndTime = Date.now();

        const batchEndTime = Date.now();
        const batchDuration = batchEndTime - batchStartTime;
        const saveDuration = saveEndTime - saveStartTime;

        console.log(
            `Batch ${batchStart}-${
                batchEnd - 1
            } processed in ${batchDuration}ms (Save time: ${saveDuration}ms)`
        );
    }

    const totalEndTime = Date.now();
    const totalDuration = totalEndTime - totalStartTime;
    console.log(`Total scraping time: ${totalDuration}ms`);
    console.log(`Average time per link: ${totalDuration / numLinks}ms`);

    await dataSource.destroy();
};

const saveCuriusData = async (data: LinkViewResponse) => {
    const { link } = data;

    // Save CuriusLink
    const curiusLink = new CuriusLink();
    Object.assign(curiusLink, {
        id: link.id,
        link: link.link,
        title: link.title,
        favorite: link.favorite,
        snippet: link.snippet || null,
        fullText: link.link.endsWith(".pdf")
            ? null
            : link.metadata?.full_text || null,
        metadata: link.metadata || null,
        createdDate: link.createdDate ? new Date(link.createdDate) : null,
        modifiedDate: link.modifiedDate ? new Date(link.modifiedDate) : null,
        lastCrawled: link.lastCrawled ? new Date(link.lastCrawled) : null,
        userIds: link.userIds || [],
        readCount: link.readCount || 0,
    });

    await curiusLinkRepo.save(curiusLink);

    // Save CuriusUsers
    if (Array.isArray(link.users)) {
        for (const user of link.users) {
            const curiusUser = new CuriusUser();
            Object.assign(curiusUser, {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                userLink: user.userLink,
                lastOnline: new Date(user.lastOnline),
            });
            curiusUser.link = Promise.resolve(curiusLink);
            await curiusUserRepo.save(curiusUser);
        }
    }

    // Save CuriusComments
    if (Array.isArray(link.comments)) {
        for (const comment of link.comments) {
            await saveCuriusComment(comment, curiusLink);
        }
    }

    // Save CuriusHighlights
    if (Array.isArray(link.highlights)) {
        for (const highlightGroup of link.highlights) {
            for (const highlight of highlightGroup) {
                await saveCuriusHighlight(highlight, curiusLink);
            }
        }
    }
};

const saveCuriusComment = async (comment, curiusLink) => {
    const curiusComment = new CuriusComment();
    Object.assign(curiusComment, {
        id: comment.id,
        userId: comment.userId,
        parentId: comment.parentId,
        text: comment.text,
        createdDate: new Date(comment.createdDate),
        modifiedDate: new Date(comment.modifiedDate),
    });
    // const user = await curiusUserRepo.findOne({
    //     where: { id: comment.userId },
    // });
    const user = await dataSource.query(
        `SELECT * FROM "curius_users" WHERE id = ${comment.userId}`
    );

    if (user) {
        curiusComment.user = user;
    }

    await curiusCommentRepo.save(curiusComment);

    if (Array.isArray(comment.replies)) {
        for (const reply of comment.replies) {
            await saveCuriusComment(reply, curiusLink);
        }
    }
};

const saveCuriusHighlight = async (highlight, curiusLink) => {
    const curiusHighlight = new CuriusHighlight();
    Object.assign(curiusHighlight, {
        id: highlight.id,
        userId: highlight.userId,
        linkId: highlight.linkId,
        highlight: highlight.highlight,
        createdDate: new Date(highlight.createdDate),
        position: highlight.position,
        verified: highlight.verified,
        leftContext: highlight.leftContext,
        rightContext: highlight.rightContext,
        rawHighlight: highlight.rawHighlight,
    });
    curiusHighlight.link = Promise.resolve(curiusLink);
    await curiusHighlightRepo.save(curiusHighlight);

    if (highlight.comment) {
        await saveCuriusComment(highlight.comment, curiusLink);
    }

    if (Array.isArray(highlight.mentions)) {
        for (const mention of highlight.mentions) {
            const curiusMention = new CuriusMention();
            Object.assign(curiusMention, {
                id: mention.id,
                fromUid: mention.fromUid,
                toUid: mention.toUid,
                createdDate: new Date(mention.createdDate),
            });
            curiusMention.link = Promise.resolve(curiusLink);
            curiusMention.user = { id: mention.user.id } as CuriusUser;
            curiusMention.highlight = Promise.resolve(curiusHighlight);
            await curiusMentionRepo.save(curiusMention);
        }
    }
};

scrapeCuriusLinks().catch(console.error);
