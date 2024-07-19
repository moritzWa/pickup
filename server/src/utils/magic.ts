import {
    Magic,
    WalletType,
    MagicWallet,
    MagicUserMetadata,
    ParsedDIDToken,
} from "@magic-sdk/admin";
import { config } from "src/config";
import { AccountProvider } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    guardSwitch,
    success,
} from "src/core/logic";

const MAGIC_SECRET_KEY = config.magic.secretKey;

let magicClient: Maybe<Magic> = null;

// Construct with an API key:
const getMagic = async (): Promise<Magic> => {
    if (magicClient) {
        return magicClient;
    }

    magicClient = await Magic.init(MAGIC_SECRET_KEY);

    return magicClient;
};

const getMetadataForWallet = async (
    issuer: string,
    walletType: WalletType
): Promise<FailureOrSuccess<DefaultErrors, Maybe<MagicWallet>>> => {
    try {
        const magic = await getMagic();

        const magicWallet = await magic.users.getMetadataByIssuerAndWallet(
            issuer,
            walletType
        );

        // if no wallet, that is acceptable state
        if (!magicWallet) {
            return success(null);
        }

        // FIXME: magic SDK has incorrect types
        const walletForUser = (magicWallet.wallets ?? []).find(
            (w: any) =>
                w.wallet_type === walletType || w.walletType === walletType
        ) as any;

        const publicAddress =
            walletForUser?.publicAddress || walletForUser?.public_address || "";

        if (!walletForUser || !publicAddress) {
            return success(null);
        }

        return success({
            publicAddress,
            walletType,
            network: walletForUser.network,
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const parseAuthorizationHeader = async (
    authHeader: string
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    try {
        const magic = await getMagic();
        const didToken = magic.utils.parseAuthorizationHeader(authHeader);

        if (!didToken) {
            return failure(new Error("Invalid token"));
        }

        magic.token.validate(didToken);

        return success(didToken);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

const getMetadataByToken = async (
    didToken: string
): Promise<FailureOrSuccess<DefaultErrors, MagicUserMetadata>> => {
    const magic = await getMagic();

    const magicUser = await magic.users.getMetadataByToken(didToken);

    if (!magicUser) {
        return failure(new Error("Invalid token"));
    }

    return success(magicUser);
};

const getMetadataByIssuer = async (
    issuer: string
): Promise<FailureOrSuccess<DefaultErrors, MagicUserMetadata>> => {
    const magic = await getMagic();

    const magicUser = await magic.users.getMetadataByIssuer(issuer);

    if (!magicUser) {
        return failure(new Error("No user."));
    }

    return success(magicUser);
};

const validateDid = async (
    didToken: string
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const magic = await getMagic();

        if (!didToken) {
            return failure(new Error("Invalid token"));
        }

        magic.token.validate(didToken);

        return success(null);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

const decodeToken = async (
    didToken: string
): Promise<FailureOrSuccess<DefaultErrors, ParsedDIDToken>> => {
    try {
        const magic = await getMagic();

        if (!didToken) {
            return failure(new Error("Invalid token"));
        }

        const parsed = magic.token.decode(didToken);

        return success(parsed);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};
// const getMetadataByToken = async (
//     didToken: string
// ): Promise<FailureOrSuccess<DefaultErrors, MagicUserMetadata>> => {
//     const magic = await getMagic();

//     const magicUser = await magic.users.getMetadataByPublicAddress(didToken);

//     if (!magicUser) {
//         return failure(new Error("Invalid token"));
//     }

//     return success(magicUser);
// };

// const deleteUser = async (
//     didToken: string
// ): Promise<FailureOrSuccess<DefaultErrors, MagicUserMetadata>> => {
//     const magic = await getMagic();

//     return success(magicUser);
// };

export const getWalletTypeForMagic = (p: AccountProvider): WalletType => {
    switch (p) {
        case AccountProvider.Solana:
            return WalletType.SOLANA;
        default:
            guardSwitch(p);
            throw new Error("Invalid provider.");
    }
};

export const magic = {
    users: { fromDid: getMetadataByToken, byIssuer: getMetadataByIssuer },
    wallets: { getPublicAddress: getMetadataForWallet },
    auth: { parse: parseAuthorizationHeader, validateDid },
    tokens: { decode: decodeToken },
};
