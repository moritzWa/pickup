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

const scrapeCuriusLinks = async () => {
    await dataSource.initialize();

    const startLink = 605;
    const numLinks = 10;
    // latest as of 2024-08-03 is 127456

    console.log(`Scraping ${numLinks} Curius Links...`);
    for (let i = startLink; i <= startLink + numLinks; i++) {
        const linkViewUrl = `https://curius.app/api/linkview/${i}`;
        const response = await fetch(linkViewUrl, { headers });
        const data: LinkViewResponse = await response.json();

        console.log("data in scrapingLinks", JSON.stringify(data, null, 2));

        await saveCuriusData(data);
    }

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
