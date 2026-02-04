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

  // S3 버킷 정책으로 CloudFront만 접근 허용
  // 개인정보 보호를 위해 public-read 사용하지 않음
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });

  await upload.done();

  // S3 공개 URL
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
