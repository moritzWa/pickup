import { config } from "src/config";
import { AWSError, KMS, SecretsManager } from "aws-sdk";
import {
    DefaultErrors,
    FailureOrSuccess,
    NotFoundError,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

const params = {
    credentials: {
        accessKeyId: config.aws.accessKey,
        secretAccessKey: config.aws.secretKey,
    },
    region: config.aws.region,
};

const kmsClient = new KMS(params);
const secretsManager = new SecretsManager();

// At of 12/20/2023, AWS doesn't support diffie-hellman key exchange for KMS
// so we can only encrypt with AES
const createKeyPair = async (): Promise<
    FailureOrSuccess<DefaultErrors, string>
> => {
    const params: KMS.CreateKeyRequest = {
        CustomerMasterKeySpec: "ECC_NIST_P256",
        KeyUsage: "ENCRYPT_DECRYPT",
        Origin: "AWS_KMS",
        Description: "My KMS Key for encryption and decryption",
    };

    try {
        const key = await kmsClient.createKey(params).promise();

        if (!key.KeyMetadata) {
            return failure(new NotFoundError("KeyMetadata not found"));
        }
        return success(key.KeyMetadata.KeyId);
    } catch (error) {
        console.error("Error creating key:", error);
        return failure(new UnexpectedError(error));
    }
};

// async function encryptData(keyId, plaintext) {
//     const params = {
//         KeyId: keyId,
//         Plaintext: Buffer.from(plaintext),
//     };

//     try {
//         const encrypted = await kms.encrypt(params).promise();
//         return encrypted.CiphertextBlob;
//     } catch (error) {
//         console.error("Error encrypting data:", error);
//     }
// }

// async function decryptData(ciphertextBlob) {
//     const params = {
//         CiphertextBlob: ciphertextBlob,
//     };

//     try {
//         const decrypted = await kms.decrypt(params).promise();
//         return decrypted.Plaintext.toString();
//     } catch (error) {
//         console.error("Error decrypting data:", error);
//     }
// }

async function storeKeyPair(
    secretName: string,
    privateKey: string,
    publicKey: string
) {
    const secretString = JSON.stringify({ privateKey, publicKey });

    const params = {
        Name: secretName,
        SecretString: secretString,
    };

    try {
        await secretsManager.createSecret(params).promise();
        console.log(`Key pair stored with name: ${secretName}`);
    } catch (error) {
        console.error("Error storing key pair:", error);
    }
}

// async function retrieveKeyPair(secretName) {
//     const params = {
//         SecretId: secretName,
//     };

//     try {
//         const secretValue = await secretsManager
//             .getSecretValue(params)
//             .promise();
//         const keyPair = JSON.parse(secretValue.SecretString);
//         return keyPair;
//     } catch (error) {
//         console.error("Error retrieving key pair:", error);
//     }
// }

export const _kms = {
    createKeyPair,
    // encryptData,
    // decryptData,
};
