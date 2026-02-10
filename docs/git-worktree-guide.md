# Git Worktree 사용 가이드

## 개요

`git worktree`는 하나의 git 저장소에서 **여러 작업 디렉토리를 동시에** 운용하는 기능.
브랜치 전환 없이 병렬 작업이 가능하고, 각 worktree는 독립된 working directory를 가짐.

```
cuggu/                  ← 메인 worktree (develop)
cuggu-spacing/          ← 추가 worktree (fix/section-spacing)
cuggu-hotfix/           ← 추가 worktree (hotfix/urgent-bug)
```

모두 같은 `.git` 저장소를 공유하므로 커밋 히스토리, remote, stash 등은 공통.

---

## 기본 명령어

### 생성

```bash
# 기존 브랜치로 worktree 생성
git worktree add <경로> <브랜치명>
git worktree add ../cuggu-spacing fix/section-spacing

# 새 브랜치 생성하면서 worktree 생성 (-b 플래그)
git worktree add <경로> -b <새브랜치명> <기준브랜치>
git worktree add ../cuggu-spacing -b fix/section-spacing develop

# 분리된 HEAD로 생성 (브랜치 없이, 임시 확인용)
git worktree add --detach ../cuggu-temp HEAD
```

### 목록 확인

```bash
git worktree list
# /Users/jyk/Documents/solbox/code/cuggu           abc1234 [develop]
# /Users/jyk/Documents/solbox/code/cuggu-spacing    def5678 [fix/section-spacing]
```

### 제거

```bash
# worktree 제거 (디렉토리도 삭제됨)
git worktree remove ../cuggu-spacing

# 강제 제거 (uncommitted changes 있어도)
git worktree remove --force ../cuggu-spacing

# 디렉토리를 수동 삭제한 경우 잔여 메타데이터 정리
git worktree prune
```

---

## 실전 워크플로우

### 시나리오 1: 기능 개발 중 핫픽스

develop에서 작업 중인데 긴급 버그 수정이 필요한 경우.

```bash
# 1. 현재 작업은 그대로 두고 핫픽스용 worktree 생성
git worktree add ../cuggu-hotfix -b hotfix/login-bug main

# 2. 핫픽스 작업
cd ../cuggu-hotfix
# ... 수정, 커밋 ...
git commit -m "fix: 로그인 세션 만료 버그 수정"

# 3. 원래 디렉토리로 돌아와서 머지
cd ../cuggu
git checkout main
git merge hotfix/login-bug

# 4. 정리
git worktree remove ../cuggu-hotfix
git branch -d hotfix/login-bug
```

### 시나리오 2: 독립 기능을 병렬 작업

```bash
# 각각 다른 기능을 동시에 작업
git worktree add ../cuggu-spacing -b fix/section-spacing develop
git worktree add ../cuggu-theme -b feat/new-theme develop

# 각 디렉토리에서 독립적으로 작업 → 커밋
# 완료 후 develop에서 순차적으로 머지
git checkout develop
git merge fix/section-spacing
git merge feat/new-theme

# 정리
git worktree remove ../cuggu-spacing
git worktree remove ../cuggu-theme
git branch -d fix/section-spacing feat/new-theme
```

### 시나리오 3: PR 리뷰 / 코드 확인

다른 사람 PR을 로컬에서 확인하고 싶을 때.

```bash
# PR 브랜치를 worktree로 체크아웃
git fetch origin pull/42/head:pr-42
git worktree add ../cuggu-review pr-42

# 확인 후 정리
git worktree remove ../cuggu-review
git branch -D pr-42
```

---

## 합치기 전략

### A. merge (기본)

히스토리를 그대로 유지하며 합침.

```bash
cd /Users/jyk/Documents/solbox/code/cuggu
git checkout develop
git merge fix/section-spacing
```

커밋이 여러 개면 merge commit 생성됨.

### B. merge --squash (커밋 압축)

여러 커밋을 하나로 압축해서 합침. 히스토리가 깔끔해짐.

```bash
git checkout develop
git merge --squash fix/section-spacing
git commit -m "fix: 섹션 간격 축소 (6개 테마 + GreetingSection 100vh 제거)"
```

### C. rebase (선형 히스토리)

브랜치 커밋들을 develop 위에 하나씩 재배치.

```bash
# worktree에서 rebase 먼저
cd ../cuggu-spacing
git rebase develop

# develop에서 fast-forward merge
cd ../cuggu
git checkout develop
git merge fix/section-spacing   # fast-forward됨
```

### D. cherry-pick (커밋 선택)

특정 커밋만 골라서 가져옴.

```bash
git checkout develop
git cherry-pick abc1234          # 특정 커밋 하나만
git cherry-pick abc1234..def5678 # 범위 지정
```

### 어떤 걸 써야 하나?

| 상황 | 추천 방식 |
|------|----------|
| 커밋 1~2개, 깔끔한 히스토리 원함 | `merge --squash` |
| 커밋별 히스토리 유지하고 싶음 | `merge` 또는 `rebase` |
| 일부 커밋만 필요 | `cherry-pick` |
| 개인 프로젝트, 간단한 작업 | `merge --squash` 추천 |

---

## 주의사항

### 같은 브랜치 동시 체크아웃 불가
```bash
# develop이 메인에서 이미 체크아웃되어 있으면 에러
git worktree add ../cuggu-dev develop
# fatal: 'develop' is already checked out at '...'
```

### node_modules / 빌드 캐시
각 worktree는 독립된 파일 시스템이므로 **의존성 별도 설치 필요**.

```bash
cd ../cuggu-spacing
npm install        # 또는 pnpm install
```

`.next/`, `node_modules/`는 worktree별로 따로 생김.
→ 디스크 용량 주의 (node_modules가 큰 프로젝트에서 특히)

### .env 파일
`.gitignore`에 포함된 파일은 worktree에 복사 안 됨.

```bash
# 필요하면 심볼릭 링크 또는 수동 복사
cp ../cuggu/.env.local ../cuggu-spacing/.env.local
```

### worktree 안에서 브랜치 전환
worktree 안에서 `git checkout`으로 다른 브랜치로 전환 가능하지만,
메인 worktree에서 체크아웃 중인 브랜치로는 전환 불가.

### 삭제 전 커밋 확인
worktree를 `remove --force`로 지우면 uncommitted changes가 유실됨.
항상 `git status`로 확인 후 제거.

---

## 빠른 참조

```bash
# 생성
git worktree add <경로> -b <브랜치> <기준>

# 목록
git worktree list

# 제거
git worktree remove <경로>

# 잔여 정리
git worktree prune

# 머지 (squash 추천)
git merge --squash <브랜치>
git commit -m "메시지"

# 브랜치 삭제
git branch -d <브랜치>
```
