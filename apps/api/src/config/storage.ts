import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { env } from './env';

export const s3Client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Necessário para MinIO
});

export const S3_BUCKET = env.S3_BUCKET;

/**
 * Verifica conexão com o storage (MinIO/S3)
 */
export async function checkStorageConnection(): Promise<boolean> {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
        return true;
    } catch (error) {
        console.error('Storage connection failed:', error);
        return false;
    }
}
