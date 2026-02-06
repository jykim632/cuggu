# CloudFront 커스텀 도메인 연결 가이드

> CloudFront 배포(A계정)에 다른 AWS 계정(B계정)의 Route 53 도메인을 연결하는 방법

## 사전 조건

- A계정: CloudFront 배포가 있는 계정 (AWS CLI 연동 필요)
- B계정: Route 53에서 도메인을 관리하는 계정 (콘솔 접근 필요)

## 전체 흐름

```
1. [A계정] ACM 인증서 발급 요청 (us-east-1)
2. [B계정] Route 53에 DNS 검증 CNAME 추가
3. ACM 인증서 검증 완료 대기 (2~30분)
4. [A계정] CloudFront 배포에 CNAME + 인증서 적용
5. [B계정] Route 53에 도메인 A(Alias) 레코드 추가
```

## 1단계: ACM 인증서 발급 요청 (A계정)

**반드시 `us-east-1` (버지니아 북부) 리전에서 발급해야 한다.** CloudFront는 us-east-1의 인증서만 사용 가능.

```bash
aws acm request-certificate \
  --domain-name <도메인> \
  --validation-method DNS \
  --region us-east-1
```

예시:
```bash
aws acm request-certificate \
  --domain-name momentcraft.solboxdev.com \
  --validation-method DNS \
  --region us-east-1
```

응답에서 `CertificateArn`을 메모해둔다.

## 2단계: DNS 검증 레코드 확인 (A계정)

```bash
aws acm describe-certificate \
  --certificate-arn <인증서ARN> \
  --region us-east-1 \
  --query "Certificate.DomainValidationOptions"
```

출력에서 `ResourceRecord`의 `Name`과 `Value`를 확인한다.

```json
{
  "Name": "_xxxxx.momentcraft.solboxdev.com.",
  "Type": "CNAME",
  "Value": "_yyyyy.jkddzztszm.acm-validations.aws."
}
```

## 3단계: Route 53에 검증용 CNAME 추가 (B계정)

B계정의 Route 53 콘솔에서:

1. 해당 도메인의 **호스팅 영역** 진입
2. **Create record** 클릭
3. 아래처럼 입력:

| 필드 | 값 |
|------|-----|
| Record name | `_xxxxx.momentcraft` (`.solboxdev.com`은 자동으로 붙음) |
| Record type | **CNAME** |
| Value | `_yyyyy.jkddzztszm.acm-validations.aws.` |
| TTL | 300 |

4. **Create records** 클릭

### 검증 확인

```bash
# DNS 전파 확인
dig _xxxxx.momentcraft.solboxdev.com CNAME @8.8.8.8 +short

# 인증서 상태 확인
aws acm describe-certificate \
  --certificate-arn <인증서ARN> \
  --region us-east-1 \
  --query "Certificate.Status" \
  --output text
```

`ISSUED`가 나올 때까지 대기 (보통 2~30분).

## 4단계: CloudFront 배포 업데이트 (A계정)

### 현재 설정 다운로드

```bash
aws cloudfront get-distribution-config \
  --id <배포ID> \
  --output json > cf-config.json
```

### 설정 수정

`cf-config.json`에서 `DistributionConfig`만 추출하여 아래 두 부분을 수정:

**Aliases (CNAME 추가):**
```json
"Aliases": {
  "Quantity": 1,
  "Items": ["momentcraft.solboxdev.com"]
}
```

**ViewerCertificate (ACM 인증서 적용):**
```json
"ViewerCertificate": {
  "ACMCertificateArn": "<인증서ARN>",
  "SSLSupportMethod": "sni-only",
  "MinimumProtocolVersion": "TLSv1.2_2021",
  "Certificate": "<인증서ARN>",
  "CertificateSource": "acm"
}
```

jq로 한번에 처리:
```bash
CERT_ARN="<인증서ARN>"
DOMAIN="momentcraft.solboxdev.com"

jq --arg cert "$CERT_ARN" --arg domain "$DOMAIN" \
  '.DistributionConfig |
   .Aliases = {"Quantity": 1, "Items": [$domain]} |
   .ViewerCertificate = {
     "ACMCertificateArn": $cert,
     "SSLSupportMethod": "sni-only",
     "MinimumProtocolVersion": "TLSv1.2_2021",
     "Certificate": $cert,
     "CertificateSource": "acm"
   }' cf-config.json > cf-update.json
```

### 배포 업데이트 적용

```bash
ETAG=$(jq -r '.ETag' cf-config.json)

aws cloudfront update-distribution \
  --id <배포ID> \
  --if-match "$ETAG" \
  --distribution-config file://cf-update.json
```

배포 상태가 `InProgress` → `Deployed`가 될 때까지 2~5분 소요.

## 5단계: Route 53에 도메인 A 레코드 추가 (B계정)

B계정의 Route 53 콘솔에서:

1. 해당 도메인의 **호스팅 영역** 진입
2. **Create record** 클릭
3. 아래처럼 입력:

| 필드 | 값 |
|------|-----|
| Record name | `momentcraft` (`.solboxdev.com`은 자동으로 붙음) |
| Record type | **A** |
| Alias | **ON** |
| Route traffic to | CloudFront distribution |
| Distribution | `d3oh3wc9o7rgg0.cloudfront.net` (직접 입력) |

4. **Create records** 클릭

> Route 53의 Alias A 레코드는 **다른 계정의 CloudFront 배포도 지원**한다. CloudFront 배포에 해당 도메인이 CNAME으로 등록되어 있으면 된다.

## 6단계: 접속 확인

```bash
# DNS 확인
dig momentcraft.solboxdev.com A @8.8.8.8 +short

# HTTPS 접속 확인
curl -sI https://momentcraft.solboxdev.com

# SSL 인증서 확인
curl -sv https://momentcraft.solboxdev.com 2>&1 | grep "subject:"
```

## 트러블슈팅

### 인증서가 PENDING_VALIDATION에서 안 넘어감
- Route 53에 CNAME 레코드가 실제로 저장되었는지 확인
- `dig <검증레코드> CNAME @8.8.8.8 +short`로 외부 DNS에서 조회 확인
- Route 53 레코드 이름에 `.solboxdev.com` 부분을 중복 입력하지 않았는지 확인

### CloudFront 업데이트 시 InvalidViewerCertificate
- 인증서가 `ISSUED` 상태인지 확인
- 인증서가 **us-east-1** 리전에 있는지 확인

### 도메인 접속 안 됨
- DNS 전파에 시간이 걸릴 수 있음 (최대 48시간, 보통 몇 분)
- `--resolve` 옵션으로 IP 직접 지정하여 테스트:
  ```bash
  curl -sv --resolve momentcraft.solboxdev.com:443:<IP> https://momentcraft.solboxdev.com
  ```

## 현재 설정 참고값

| 항목 | 값 |
|------|-----|
| CloudFront 배포 ID | `E3E4KM75QHUI56` |
| CloudFront 도메인 | `d3oh3wc9o7rgg0.cloudfront.net` |
| ACM 인증서 ARN | `arn:aws:acm:us-east-1:194893387801:certificate/660613f9-a804-41d2-8dd2-4a8f457170fe` |
| 커스텀 도메인 | `momentcraft.solboxdev.com` |
| AWS 계정 (CloudFront) | `194893387801` |
