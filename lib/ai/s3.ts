import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createId } from '@paralleldrive/cuid2';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * S3에 이미지 업로드
 *
 * @param buffer - 이미지 버퍼
 * @param contentType - MIME 타입
 * @param prefix - 폴더 경로 (예: 'ai-photos')
 * @returns 공개 URL
 */
export async function uploadToS3(
  buffer: Buffer,
  contentType: string,
  prefix: string = 'ai-photos'
): Promise<string> {
  const key = `${prefix}/${createId()}.png`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // 공개 읽기 권한
    },
  });

  await upload.done();

  // S3 공개 URL
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
