/**
 * 청첩장 API 테스트 스크립트
 *
 * 실행 방법:
 * 1. 서버 실행: npm run dev
 * 2. 다른 터미널에서: npx tsx scripts/test-invitation-api.ts
 */

const API_BASE = 'http://localhost:3000/api';

// 색상 출력 유틸
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

// 테스트용 청첩장 데이터
const testInvitation = {
  templateId: 'classic',
  groom: {
    name: '테스트신랑',
    fatherName: '신랑아버지',
    motherName: '신랑어머니',
    relation: '장남',
  },
  bride: {
    name: '테스트신부',
    fatherName: '신부아버지',
    motherName: '신부어머니',
    relation: '장녀',
  },
  wedding: {
    date: new Date('2026-12-25T14:00:00Z').toISOString(),
    venue: {
      name: '테스트웨딩홀',
      hall: '3층 그랜드홀',
      address: '서울시 강남구 테헤란로 123',
    },
  },
  content: {
    greeting: '테스트 인사말입니다.',
  },
};

// 쿠키 저장
let cookies: string[] = [];

// API 호출 헬퍼
async function apiCall(
  method: string,
  path: string,
  body?: any,
  includeCookies = true
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeCookies && cookies.length > 0) {
    headers.Cookie = cookies.join('; ');
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);

  // 쿠키 저장
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    cookies.push(setCookie.split(';')[0]);
  }

  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

// 테스트 시작
async function runTests() {
  console.log('\n🧪 청첩장 API 테스트 시작\n');

  let invitationId: string | null = null;

  try {
    // ========================================
    // 1. POST /api/invitations - 생성
    // ========================================
    log.info('테스트 1: 청첩장 생성 (POST /api/invitations)');

    const createResponse = await apiCall('POST', '/invitations', testInvitation);

    if (createResponse.status === 201 && createResponse.data.success) {
      invitationId = createResponse.data.data.id;
      log.success(`생성 성공! ID: ${invitationId}`);
      log.info(`URL: ${createResponse.data.data.url}`);
    } else if (createResponse.status === 401) {
      log.error('인증 실패 - 먼저 로그인이 필요합니다');
      log.warn('브라우저에서 http://localhost:3000/login 접속 후 로그인하세요');
      return;
    } else {
      log.error(`생성 실패: ${JSON.stringify(createResponse.data)}`);
      return;
    }

    console.log('');

    // ========================================
    // 2. GET /api/invitations - 목록 조회
    // ========================================
    log.info('테스트 2: 청첩장 목록 조회 (GET /api/invitations)');

    const listResponse = await apiCall('GET', '/invitations');

    if (listResponse.ok && listResponse.data.success) {
      const { total, invitations } = listResponse.data.data;
      log.success(`목록 조회 성공! 총 ${total}개`);
      if (invitations.length > 0) {
        log.info(`첫 번째 청첩장: ${invitations[0].groomName} ♥ ${invitations[0].brideName}`);
      }
    } else {
      log.error(`목록 조회 실패: ${JSON.stringify(listResponse.data)}`);
    }

    console.log('');

    // ========================================
    // 3. GET /api/invitations/[id] - 단건 조회
    // ========================================
    if (invitationId) {
      log.info(`테스트 3: 청첩장 조회 (GET /api/invitations/${invitationId})`);

      const getResponse = await apiCall('GET', `/invitations/${invitationId}`);

      if (getResponse.ok && getResponse.data.success) {
        const inv = getResponse.data.data;
        log.success('조회 성공!');
        log.info(`신랑: ${inv.groomName}, 신부: ${inv.brideName}`);
        log.info(`예식장: ${inv.venueName}`);
        log.info(`상태: ${inv.status}, 조회수: ${inv.viewCount}`);
      } else {
        log.error(`조회 실패: ${JSON.stringify(getResponse.data)}`);
      }

      console.log('');
    }

    // ========================================
    // 4. PUT /api/invitations/[id] - 수정
    // ========================================
    if (invitationId) {
      log.info(`테스트 4: 청첩장 수정 (PUT /api/invitations/${invitationId})`);

      const updateData = {
        groom: {
          name: '수정된신랑',
        },
        content: {
          greeting: '수정된 인사말입니다!',
        },
      };

      const updateResponse = await apiCall(
        'PUT',
        `/invitations/${invitationId}`,
        updateData
      );

      if (updateResponse.ok && updateResponse.data.success) {
        log.success('수정 성공!');
        log.info(`수정 시각: ${updateResponse.data.data.updatedAt}`);

        // 수정 확인
        const verifyResponse = await apiCall('GET', `/invitations/${invitationId}`);
        if (verifyResponse.ok) {
          const inv = verifyResponse.data.data;
          if (inv.groomName === '수정된신랑') {
            log.success('수정 내용 확인 완료!');
          }
        }
      } else {
        log.error(`수정 실패: ${JSON.stringify(updateResponse.data)}`);
      }

      console.log('');
    }

    // ========================================
    // 5. DELETE /api/invitations/[id] - 삭제
    // ========================================
    if (invitationId) {
      log.warn(`테스트 5: 청첩장 삭제 (DELETE /api/invitations/${invitationId})`);

      const deleteResponse = await apiCall('DELETE', `/invitations/${invitationId}`);

      if (deleteResponse.ok && deleteResponse.data.success) {
        log.success('삭제 성공!');

        // 삭제 확인 (조회 시 상태가 DELETED여야 함)
        const verifyResponse = await apiCall('GET', `/invitations/${invitationId}`);
        if (verifyResponse.ok) {
          const inv = verifyResponse.data.data;
          if (inv.status === 'DELETED') {
            log.success('삭제 상태 확인 완료 (Soft Delete)');
          }
        }
      } else {
        log.error(`삭제 실패: ${JSON.stringify(deleteResponse.data)}`);
      }

      console.log('');
    }

    // ========================================
    // 완료
    // ========================================
    console.log('');
    log.success('모든 테스트 완료! 🎉');
    console.log('');

  } catch (error) {
    console.log('');
    log.error(`테스트 중 오류 발생: ${error}`);
    console.log('');

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      log.warn('서버가 실행 중이 아닙니다. npm run dev로 서버를 먼저 실행하세요.');
    }
  }
}

// 실행
runTests();
