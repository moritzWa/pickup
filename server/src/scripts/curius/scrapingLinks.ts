import { dataSource } from "src/core/infra/postgres";
import {
    CuriusComment,
    CuriusHighlight,
    CuriusLink,
    CuriusMention,
    CuriusUser,
} from "src/core/infra/postgres/entities/";
import { LinkViewResponse } from "./types";

const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mjk1NywiaWF0IjoxNzE1NTUwMzA2LCJleHAiOjE3NDY5OTk5MDZ9.tjIhVHbkf_lc3st0hdLdoUTDfN32VaQPeWYGRKlNGNc";
const headers = {
    Authorization: `Bearer ${token}`,
};

const BATCH_SIZE = 50; // Increased batch size

const scrapeCuriusLinks = async () => {
    await dataSource.initialize();

    const startLink = 21;
    const numLinks = 179;
    // latest as of 2024-08-03 is 127456

    console.log(`Scraping ${numLinks} Curius Links...`);

    const promises: Promise<LinkViewResponse>[] = [];
    for (let i = startLink; i < startLink + numLinks; i++) {
        const linkViewUrl = `https://curius.app/api/linkview/${i}`;
        promises.push(
            fetch(linkViewUrl, { headers }).then((res) => res.json())
        );

        if (promises.length === BATCH_SIZE || i === startLink + numLinks - 1) {
            const results = await Promise.all(promises);
            console.log(`Saving ${results.length} links...`);
            await dataSource.transaction(async (transactionalEntityManager) => {
                for (const data of results) {
                    await saveCuriusData(data, transactionalEntityManager);
                }
            });
            promises.length = 0; // Clear the array
        }
    }

    await dataSource.destroy();
};

const saveCuriusData = async (
    data: LinkViewResponse,
    transactionalEntityManager
) => {
    const { link } = data;

    // Save CuriusLink
    const curiusLink = new CuriusLink();
    Object.assign(curiusLink, {
        id: link.id,
        link: link.link,
        title: link.title,
        favorite: link.favorite,
        snippet: link.snippet || null,
        metadata: link.metadata || null,
        createdDate: link.createdDate ? new Date(link.createdDate) : null,
        modifiedDate: link.modifiedDate ? new Date(link.modifiedDate) : null,
        lastCrawled: link.lastCrawled ? new Date(link.lastCrawled) : null,
        userIds: link.userIds || [],
        readCount: link.readCount || 0,
    });

    await transactionalEntityManager.save(CuriusLink, curiusLink);

    // Save CuriusUsers
    if (Array.isArray(link.users)) {
        const curiusUsers = link.users.map((user) => {
            const curiusUser = new CuriusUser();
            Object.assign(curiusUser, {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                userLink: user.userLink,
                lastOnline: new Date(user.lastOnline),
            });
            curiusUser.link = Promise.resolve(curiusLink);
            return curiusUser;
        });
        await transactionalEntityManager.save(CuriusUser, curiusUsers);
    }

    // Save CuriusComments
    if (Array.isArray(link.comments)) {
        await saveCuriusComments(
            link.comments,
            curiusLink,
            transactionalEntityManager
        );
    }

    // Save CuriusHighlights
    if (Array.isArray(link.highlights)) {
        const highlights = link.highlights.flat();
        await saveCuriusHighlights(
            highlights,
            curiusLink,
            transactionalEntityManager
        );
    }
};

const saveCuriusComments = async (
    comments,
    curiusLink,
    transactionalEntityManager
) => {
    const curiusComments = comments.map((comment) => {
        const curiusComment = new CuriusComment();
        Object.assign(curiusComment, {
            id: comment.id,
            userId: comment.userId,
            parentId: comment.parentId,
            text: comment.text,
            createdDate: new Date(comment.createdDate),
            modifiedDate: new Date(comment.modifiedDate),
        });
        curiusComment.link = Promise.resolve(curiusLink);
        return curiusComment;
    });

    await transactionalEntityManager.save(CuriusComment, curiusComments);

    for (const comment of comments) {
        if (Array.isArray(comment.replies)) {
            await saveCuriusComments(
                comment.replies,
                curiusLink,
                transactionalEntityManager
            );
        }
    }
};

const saveCuriusHighlights = async (
    highlights,
    curiusLink,
    transactionalEntityManager
) => {
    const curiusHighlights = highlights.map((highlight) => {
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
        return curiusHighlight;
    });

    await transactionalEntityManager.save(CuriusHighlight, curiusHighlights);

    for (const highlight of highlights) {
        if (highlight.comment) {
            await saveCuriusComments(
                [highlight.comment],
                curiusLink,
                transactionalEntityManager
            );
        }

        if (Array.isArray(highlight.mentions)) {
            const curiusMentions = highlight.mentions.map((mention) => {
                const curiusMention = new CuriusMention();
                Object.assign(curiusMention, {
                    fromUid: mention.fromUid,
                    toUid: mention.toUid,
                    createdDate: new Date(mention.createdDate),
                });
                curiusMention.link = Promise.resolve(curiusLink);
                curiusMention.user = { id: mention.user.id } as CuriusUser;
                curiusMention.highlight = Promise.resolve(curiusHighlights);
                return curiusMention;
            });
            await transactionalEntityManager.save(
                CuriusMention,
                curiusMentions
            );
        }
    }
};

scrapeCuriusLinks().catch(console.error);
