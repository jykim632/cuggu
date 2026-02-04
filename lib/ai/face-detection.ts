import { FaceClient } from '@azure/cognitiveservices-face';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';
import { env } from './env';
import { logger } from './logger';

const credentials = new CognitiveServicesCredentials(
  env.AZURE_FACE_API_KEY
);
const client = new FaceClient(credentials, env.AZURE_FACE_ENDPOINT);

/**
 * 이미지에서 얼굴 감지
 *
 * @returns true if exactly 1 face detected
 */
export async function detectFace(imageBuffer: Buffer): Promise<{
  success: boolean;
  faceCount: number;
  error?: string;
}> {
  try {
    const faces = await client.face.detectWithStream(imageBuffer, {
      returnFaceId: false,
      returnFaceLandmarks: false,
      returnFaceAttributes: [],
    });

    if (faces.length === 0) {
      return {
        success: false,
        faceCount: 0,
        error: '얼굴이 감지되지 않았습니다',
      };
    }

    if (faces.length > 1) {
      return {
        success: false,
        faceCount: faces.length,
        error: '1명의 얼굴만 업로드해주세요',
      };
    }

    return { success: true, faceCount: 1 };
  } catch (error: any) {
    logger.error('Face detection error', {
      error: error instanceof Error ? error.message : String(error),
      statusCode: error.statusCode,
      code: error.code,
    });

    // Azure Face API 에러 코드별 처리
    if (error.statusCode === 401 || error.code === 'Unauthorized') {
      return {
        success: false,
        faceCount: 0,
        error: 'API 설정 오류입니다. 관리자에게 문의하세요.',
      };
    }

    if (error.statusCode === 429 || error.code === 'RateLimitExceeded') {
      return {
        success: false,
        faceCount: 0,
        error: '일시적으로 서비스가 혼잡합니다. 잠시 후 다시 시도해주세요.',
      };
    }

    if (error.statusCode === 400 || error.code === 'InvalidImageSize') {
      return {
        success: false,
        faceCount: 0,
        error: '이미지 크기가 너무 작거나 큽니다.',
      };
    }

    return {
      success: false,
      faceCount: 0,
      error: '얼굴 감지 실패. 정면을 바라본 선명한 사진을 업로드해주세요.',
    };
  }
}
