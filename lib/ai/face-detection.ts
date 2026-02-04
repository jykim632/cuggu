import { FaceClient } from '@azure/cognitiveservices-face';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';

const credentials = new CognitiveServicesCredentials(
  process.env.AZURE_FACE_API_KEY!
);
const client = new FaceClient(credentials, process.env.AZURE_FACE_ENDPOINT!);

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
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      success: false,
      faceCount: 0,
      error: '얼굴 감지 실패',
    };
  }
}
