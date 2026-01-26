import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { ExternalServiceError } from '../utils/errors';
import { injectable, singleton } from 'tsyringe';

export interface StorageKey {
  tenantId: string;
  companyId: string;
  docType: string;
  year: number;
  month: number;
  documentId: string;
}

function buildKey(params: StorageKey): string {
  const { tenantId, companyId, docType, year, month, documentId } = params;
  return `${tenantId}/${companyId}/${docType}/${year}/${month.toString().padStart(2, '0')}/${documentId}.xml`;
}

@singleton()
@injectable()
export class StorageService {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async uploadXml(params: StorageKey, xml: string): Promise<string> {
    const key = buildKey(params);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
          Body: xml,
          ContentType: 'application/xml',
          Metadata: {
            tenantId: params.tenantId,
            companyId: params.companyId,
            docType: params.docType,
            documentId: params.documentId,
          },
        })
      );

      return key;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('S3', `Falha ao fazer upload: ${message}`);
    }
  }

  async downloadXml(key: string): Promise<string> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        })
      );

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      return await response.Body.transformToString('utf-8');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('S3', `Falha ao baixar XML: ${message}`);
    }
  }

  async deleteXml(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('S3', `Falha ao deletar XML: ${message}`);
    }
  }

  async generatePresignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('S3', `Falha ao gerar URL: ${message}`);
    }
  }

  async uploadPdf(params: StorageKey, pdf: Buffer): Promise<string> {
    const key = buildKey(params).replace('.xml', '.pdf');

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
          Body: pdf,
          ContentType: 'application/pdf',
        })
      );

      return key;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('S3', `Falha ao fazer upload PDF: ${message}`);
    }
  }

  async downloadPdf(key: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        })
      );

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('S3', `Falha ao baixar PDF: ${message}`);
    }
  }

  async uploadZip(key: string, buffer: Buffer): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: 'application/zip',
          Metadata: { type: 'batch-download' }
        })
      );
      return key;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceError('S3', `Falha ao fazer upload ZIP: ${message}`);
    }
  }
}

// Export singleton instance for backward compatibility (transition period)
import { container } from 'tsyringe';
export const storage = container.resolve(StorageService);
