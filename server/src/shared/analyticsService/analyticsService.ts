import { failure, UnexpectedError } from "src/core/logic";
// import { analytics } from "src/utils/segment";

export enum EventName {
    UserCreated = "User Created",
    AccountCreated = "Account Created",
    CheckoutCompleted = "Checkout Completed",
    ReferralClaimed = "Referral Claimed",
    FreeSubscription = "Free Subscription",
    SwapCreated = "Swap Created",
}

export type TrackParams = {
    userId?: string;
    anonymousId?: string;
    eventName: EventName;
    properties?: any;
};

const track = ({ userId, anonymousId, eventName, properties }: TrackParams) => {
    try {
        if (!userId && !anonymousId) {
            return failure(new Error("Need either a user ID or anonymous ID."));
        }

        // analytics.track({
        //     userId,
        //     anonymousId,
        //     event: eventName,
        //     properties,
        // });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const AnalyticsService = {
    track,
};
