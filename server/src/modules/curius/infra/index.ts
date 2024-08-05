import {
    CuriusComment,
    CuriusHighlight,
    CuriusLink,
    CuriusLinkChunk,
    CuriusMention,
    CuriusUser,
} from "src/core/infra/postgres/entities";
import { PostgresCuriusCommentRepository } from "./commentRepo";
import { PostgresCuriusHighlightRepository } from "./highlightRepo";
import { PostgresCuriusLinkChunkRepository } from "./linkChunkRepo";
import { PostgresCuriusLinkRepository } from "./linkRepo";
import { PostgresCuriusMentionRepository } from "./mentionRepo";
import { PostgresCuriusUserRepository } from "./userRepo";

export const curiusLinkRepo = new PostgresCuriusLinkRepository(CuriusLink);
export const curiusLinkChunkRepo = new PostgresCuriusLinkChunkRepository(
    CuriusLinkChunk
);
export const curiusUserRepo = new PostgresCuriusUserRepository(CuriusUser);
export const curiusCommentRepo = new PostgresCuriusCommentRepository(
    CuriusComment
);
export const curiusHighlightRepo = new PostgresCuriusHighlightRepository(
    CuriusHighlight
);
export const curiusMentionRepo = new PostgresCuriusMentionRepository(
    CuriusMention
);
