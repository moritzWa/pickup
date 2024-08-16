import { Dictionary, keyBy } from "lodash";
import { fork } from "radash";
import { connect } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { contentRepo } from "src/modules/content/infra";
import { Not, IsNull } from "typeorm";

const testAuthors = async () => {
    const content = await contentRepo.find({
        where: {
            audioUrl: Not(IsNull()),
        },
    });

    debugger;

    const withNoAuthor = content.value.filter((c) => !c.authors.length);

    debugger;
};

// if running this main file, scrape all the podcasts
connect()
    .then(() => testAuthors())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
