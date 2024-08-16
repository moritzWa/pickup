import { Dictionary, keyBy } from "lodash";
import { fork } from "radash";
import { connect } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { contentRepo } from "src/modules/content/infra";
import { RSSFeedService } from "src/modules/content/services/rss/rssFeedService";
import { In } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ContentType } from "src/core/infra/postgres/entities/Content/Content";

// https://pod.link/
export const PODCASTS = [
    {
        // MFM
        url: "https://feeds.megaphone.fm/HS2300184645",
        name: "My First Million",
    },
    {
        // How I built this
        url: "https://rss.art19.com/how-i-built-this",
        name: "How I Built This",
    },
    {
        // Founders
        url: "https://feeds.simplecast.com/3hnxp7yk",
        name: "Founders",
    },
    {
        url: "https://rss.art19.com/masters-of-scale",
        name: "Masters of Scale",
    },
    {
        url: "https://feeds.transistor.fm/acquired",
        name: "Acquired",
    },
    {
        url: "https://feeds.simplecast.com/JGE3yC0V",
        name: "a16z",
    },
    {
        url: "https://rss.art19.com/tim-ferriss-show",
        name: "The Tim Ferriss Show",
    },
    {
        url: "https://rss.art19.com/business-wars",
        name: "Business Wars",
    },
    {
        url: "https://nathanlatkathetop.libsyn.com/rss",
        name: "SaaS Interviews with CEOs, Startups, Founders",
    },
    {
        url: "https://allinchamathjason.libsyn.com/rss",
        name: "All-In with Chamath, Jason, Sacks & Friedberg",
    },
    {
        url: "https://thetwentyminutevc.libsyn.com/rss",
        name: "20VC",
    },
    {
        url: "https://api.substack.com/feed/podcast/10845.rss",
        name: "Lenny's Podcast",
    },
    {
        url: "https://feeds.megaphone.fm/CLS2859450455",
        name: "Invest Like the Best with Patrick O'Shaughnessy",
    },
    {
        url: "https://api.substack.com/feed/podcast/1084089.rss",
        name: "Latent Space",
    },
    {
        url: "https://feeds.megaphone.fm/nopriors",
        name: "No Priors",
    },
    {
        url: "https://feeds.megaphone.fm/turpentinevc",
        name: "Turpentine VC",
    },
    {
        url: "https://feeds.megaphone.fm/FRCH6787238462",
        name: "In Depth",
    },
    {
        url: "https://anchor.fm/s/e160ece4/podcast/rss",
        name: "Pirate Wires",
    },
    {
        url: "https://feeds.megaphone.fm/ATHLLC5883700320",
        name: "How to Take Over the World",
    },
    {
        url: "https://naval.libsyn.com/rss",
        name: "Naval",
    },
];

const scrapePodcasts = async () => {
    console.log(`[scraping ${PODCASTS.length} podcasts]`);

    // debugger;

    for (const podcast of PODCASTS) {
        const contentResponse = await RSSFeedService.scrapeRssFeed(
            podcast.url,
            podcast.name,
            ContentType.PODCAST
        );

        if (contentResponse.isFailure()) {
            debugger;
            continue;
        }

        const referenceIds = contentResponse.value.map((c) => c.referenceId);

        const referencedContentResponse = await contentRepo.find({
            where: {
                referenceId: In(referenceIds),
            },
        });

        const referencedContentByRefId = keyBy<Content>(
            referencedContentResponse.value,
            (c: Content) => c.referenceId || uuidv4()
        );

        const [contentToAdd, contentToUpdate] = fork(
            contentResponse.value,
            (c) => !referencedContentByRefId[c.referenceId || ""]
        );

        // backfill content already added
        await Promise.all(
            contentToUpdate.map(async (c) => {
                const refContent =
                    referencedContentByRefId[c.referenceId || ""]!;

                if (refContent) {
                    // update that content with the fields
                    const newContent = { ...refContent };
                    newContent.id = refContent.id;
                    newContent.thumbnailImageUrl = c.thumbnailImageUrl;
                    newContent.authors = c.authors;
                    newContent.sourceImageUrl = c.sourceImageUrl;
                    newContent.referenceId = c.referenceId;

                    const response = await contentRepo.save(newContent);

                    if (response.isFailure()) {
                        debugger;
                    }
                }
            })
        );

        const response = await contentRepo.bulkInsert(contentToAdd);

        console.log(`[inserted ${contentToAdd.length} content]`);
        console.log(`[updated ${contentToUpdate.length} content]`);
        console.log(`[finished ${podcast.name}]`);
    }

    debugger;
};

// if running this main file, scrape all the podcasts
connect()
    .then(() => scrapePodcasts())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
