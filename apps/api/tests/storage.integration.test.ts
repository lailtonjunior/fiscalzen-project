import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { S3Client, CreateBucketCommand, DeleteBucketCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageService } from '../src/services/storage';

// Note: These tests require MinIO to be running at localhost:9000

describe('StorageService Integration', () => {
    let storage: StorageService;
    let s3Client: S3Client;
    const testBucket = 'fiscalzen-test';

    beforeAll(async () => {
        // Create S3 client for setup/teardown
        s3Client = new S3Client({
            endpoint: 'http://localhost:9000',
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'minioadmin',
                secretAccessKey: 'minioadmin',
            },
            forcePathStyle: true,
        });

        // Try to create test bucket (ignore if exists)
        try {
            await s3Client.send(new CreateBucketCommand({ Bucket: testBucket }));
        } catch {
            // Bucket may already exist
        }

        // Note: StorageService uses env vars, so these tests need proper .env.test
        // For now we'll skip instantiation if env is missing
    });

    afterAll(async () => {
        // Cleanup: Delete all objects in test bucket
        try {
            const objects = await s3Client.send(new ListObjectsV2Command({ Bucket: testBucket }));
            if (objects.Contents) {
                for (const obj of objects.Contents) {
                    await s3Client.send(new DeleteObjectCommand({ Bucket: testBucket, Key: obj.Key }));
                }
            }
        } catch {
            // Ignore cleanup errors
        }
    });

    it.skip('should upload and download XML', async () => {
        // This test is skipped in CI - run locally with MinIO
        const xml = '<root><test>data</test></root>';
        const key = await storage.uploadXml({
            tenantId: 'test-tenant',
            companyId: 'test-company',
            docType: 'NFE',
            year: 2024,
            month: 1,
            documentId: 'test-doc-1',
        }, xml);

        expect(key).toContain('test-tenant');
        expect(key).toContain('.xml');

        const downloaded = await storage.downloadXml(key);
        expect(downloaded).toBe(xml);
    });

    it.skip('should upload ZIP file', async () => {
        const zipBuffer = Buffer.from('PK mock zip content');
        const key = 'test-tenant/downloads/test.zip';

        const result = await storage.uploadZip(key, zipBuffer);
        expect(result).toBe(key);
    });

    it.skip('should generate presigned URL', async () => {
        const key = 'test-tenant/test-file.xml';
        // First upload something
        await storage.uploadXml({
            tenantId: 'test-tenant',
            companyId: 'test-company',
            docType: 'NFE',
            year: 2024,
            month: 1,
            documentId: 'presign-test',
        }, '<test/>');

        const url = await storage.generatePresignedUrl(key, 3600);
        expect(url).toContain('http');
        expect(url).toContain('X-Amz-Signature');
    });
});
