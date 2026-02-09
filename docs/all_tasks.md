# Cuggu - 전체 작업 목록

> 총 48개 | 완료 25 | 진행중 3 | 대기 20
> 최종 업데이트: 2026-02-09

---

## P0 - Critical

- [x] `cuggu-z3j` 프로젝트 초기 설정
- [x] `cuggu-1fd` 데이터베이스 설정 (Supabase + Drizzle ORM)
- [x] `cuggu-tul` 인증 시스템 구현 (NextAuth.js)
- [x] `cuggu-rke` AI 사진 생성 시스템 (핵심 기능)
- [x] `cuggu-a1e` AI 생성 시스템 코드 리뷰 이슈 수정
- [x] `cuggu-0o1` 환경 변수 설정 (AWS, Azure, Replicate, Upstash)
- [ ] `cuggu-6c2` Figma 템플릿 디자인 (디자이너) ⏳ 진행중

---

## P1 - High

### 템플릿 & 편집기
- [x] `cuggu-l2i` 기본 템플릿 5개 개발
- [x] `cuggu-u2j` 드래그 앤 드롭 편집기 구현
- [x] `cuggu-1ul` 설정 탭 섹션 순서 드래그앤드롭 구현
- [x] `cuggu-cul` 템플릿 리팩토링: 공유 섹션 컴포넌트 추출 ⏳ 진행중
- [ ] `cuggu-9t6` Figma 스타일 청첩장 편집기 구현 ⏳ 진행중
- [ ] `cuggu-4rv` 폰트 선택 시스템 구현 🔒 blocked by: cuggu-cul
- [ ] `cuggu-erp` 엔딩 섹션 구현 (사진 + 마무리 문구) 🔒 blocked by: cuggu-cul
- [ ] `cuggu-jrt` D-Day 달력 위젯 구현 🔒 blocked by: cuggu-cul
- [ ] `cuggu-bpa` 커스텀 OG 공유 이미지 설정 🔒 blocked by: cuggu-cul

### 청첩장 기능
- [x] `cuggu-ave` 청첩장 CRUD API 구현
- [x] `cuggu-kdl` 공개 청첩장 페이지 구현
- [x] `cuggu-jem` 청첩장 공유 기능
- [x] `cuggu-04b` RSVP 기능 구현
- [x] `cuggu-57q` 지도 표시 및 길찾기 버튼 구현 (Kakao Map)
- [x] `cuggu-fci` 주소 검색 및 Geocoding 구현 (Kakao Map API)
- [ ] `cuggu-qka` 청첩장 목록 페이지 구현
- [ ] `cuggu-rqq` 다양한 가족 형태 지원 (한부모/고인/익명 표기)

### AI 사진
- [x] `cuggu-i4g` 크레딧 조회 API 구현
- [x] `cuggu-6b1` AIPhotoUploader 컴포넌트 구현
- [x] `cuggu-l5y` StyleSelector 컴포넌트 구현
- [x] `cuggu-a5f` GenerationProgress 컴포넌트 구현
- [x] `cuggu-prh` ResultGallery 컴포넌트 구현
- [x] `cuggu-vdk` AI Photos 페이지 메인 로직 구현

### 결제 & 설계
- [ ] `cuggu-8vc` 결제 시스템 (Toss Payments)
- [ ] `cuggu-ssa` AI 서비스 분리 설계 (Phase 2 대비)

---

## P2 - Medium

### 스키마 & 섹션 순서
- [x] `cuggu-3ha` 스키마에 sectionOrder 필드 추가
- [x] `cuggu-9ik` DB 매핑에 sectionOrder 추가
- [x] `cuggu-52c` SettingsTab에 섹션 순서 UI 추가
- [x] `cuggu-9ci` 템플릿 4개 동적 섹션 렌더링 적용

### 기능
- [ ] `cuggu-3f3` 갤러리 슬라이드 레이아웃 추가
- [ ] `cuggu-s2k` 방명록(Guestbook) 구현
- [ ] `cuggu-skm` Admin 템플릿 선택 UI 구현
- [ ] `cuggu-9xi` NextAuth sessions 테이블 분리 (Supabase Auth 충돌 해결)

### 테스트 & 검증
- [ ] `cuggu-3pb` 실제 서비스 연동 테스트
- [ ] `cuggu-6zb` 에러 케이스 테스트
- [ ] `cuggu-bq5` 모바일 반응형 검증
- [ ] `cuggu-7to` 베타 테스트 및 버그 수정

### 인프라 & 보안
- [ ] `cuggu-fst` 성능 테스트 및 최적화
- [ ] `cuggu-kgz` 이미지 최적화 및 CDN 설정
- [ ] `cuggu-8bw` 보안 강화

---

## P3 - Backlog

- [ ] `cuggu-vcx` [Phase 2] NestJS AI 마이크로서비스 구축
