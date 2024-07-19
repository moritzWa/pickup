import {
    FeedComment,
    FeedLike,
    FeedPost,
} from "src/core/infra/postgres/entities";
import { PostgresFeedPostRepository } from "./feedPostRepo";
import { PostgresFeedCommentRepository } from "./feedCommentRepo";
import { PostgresFeedLikeRepository } from "./feedLikeRepo";

export const pgFeedPostRepository = new PostgresFeedPostRepository(FeedPost);

export const pgFeedCommentRepository = new PostgresFeedCommentRepository(
    FeedComment
);

export const pgFeedLikeRepository = new PostgresFeedLikeRepository(FeedLike);
