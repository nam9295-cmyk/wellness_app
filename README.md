# 웰니스 앱 MVP 프로젝트 가이드

요청하신 Expo Router, TypeScript 기반의 웰니스 앱 MVP 초기 세팅이 현재 폴더에 완료되었습니다. (Expo SDK 54 연동 기반 고려)

---

## 1. 전체 폴더 구조
```text
welness_app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx       # 탭 네비게이션 설정 
│   │   ├── index.tsx         # [홈] 요약 화면
│   │   ├── log.tsx           # [기록] 수분, 기분 등 상태 추가 화면
│   │   ├── report.tsx        # [리포트] 주간 요약 및 차트 라우트 화면
│   │   └── my.tsx            # [마이] 프로필 및 목표 설정 화면
│   ├── _layout.tsx           # 최상위 라우터 (Stack 네비게이터)
│   └── onboarding.tsx        # 앱 첫 진입 진입점 (온보딩 화면)
├── components/
│   └── Card.tsx              # 홈/리포트에서 쓸 공통 카드 UI 컴포넌트
├── lib/
│   └── theme.ts              # 컬러, 간격 전역 관리 (StyleSheet 기반 스타일 참조용)
├── types/
│   └── index.ts              # 데이터 모델 타입 (사용자, 기록 등)
├── app.json                  # Expo 프로젝트 메타데이터 
├── package.json              # 의존성 모듈 (react-native, expo-router 등)
└── tsconfig.json             # TypeScript 설정 파일
```

---

## 2. 설치 명령어
파일들이 모두 준비되어 있으므로, 현재 위치한 빈 디렉토리 환경에서 아래 명령어로 패키지만 설치하시면 됩니다.

```bash
npm install
```

*(참고: 추후 다른 곳에 완전히 새로운 프로젝트를 생성하시려면 아래 명령어를 사용합니다)*
```bash
npx create-expo-app@latest wellness-app --template blank-typescript
```

---

## 3. 파일별 핵심 기능 안내
작업 공간에 생성된 코드는 더미 UI로 작성되었으며, 곧바로 편집 가능합니다.

- **`app/_layout.tsx`**: 온보딩 뷰와 메인 `(tabs)` 환경을 묶는 최상단 스택.
- **`app/(tabs)/_layout.tsx`**: 하단 네비게이션 탭 아이콘 및 설정 연결.
- **`app/onboarding.tsx`**: 시작 시 처음 렌더링되며, 클릭 시 메인 탭으로 전송하는 역할.
- **`lib/theme.ts`**: 전체적인 앱 컬러 테마(초록색 기반 웰니스 톤) 지정.

모든 소스 코드는 디렉토리에 생성해 두었으니 에디터에서 자유롭게 확인 및 수정하실 수 있습니다.

---

## 4. 실행 방법
패키지 설치가 완료되면(npm install 수행 완료 시), 다음 명령어로 기기 또는 시뮬레이터에서 앱을 실행할 수 있습니다.

```bash
npx expo start
```

- **안드로이드 / 아이폰 (실기기)**: 스마트폰 스토어에서 `Expo Go` 앱 다운로드 후 터미널에 뜬 QR 코드를 기본 카메라(AOS/iOS)로 스캔.
- **가상 시뮬레이터**: `npx expo start` 입력 후 터미널 메뉴에서 `i` (iOS) 혹은 `a` (Android)를 누르면 시뮬레이터에서 즉시 실행됩니다.

---

## 5. 자주 나는 오류와 해결법

🔸 **문제 1: 하단 탭이나 아이콘이 ? 네모 아이콘으로 뜰 때**
- **원인**: `@expo/vector-icons` 패키징 혹은 폰트 번들링이 정상적으로 로드되지 않은 상태입니다.
- **해결법**: 터미널 구동을 종료하고 캐시를 초기화하여 재실행합니다. `npx expo start -c`

🔸 **문제 2: 새로운 파일을 추가해도 경로 라우팅(Not Found)이 안 될 때**
- **원인**: Expo Router의 Metro 캐시가 이전 파일 구성을 기억하고 있어서 발생합니다.
- **해결법**: 터미널에서 앱을 끄고 캐시를 삭제하며 다시 실행합니다. `npx expo start -c`

🔸 **문제 3: `peer dependency` 경고가 발생할 때**
- **원인**: 최신 React Native/Expo 생태계 상 패키지 버전 스큐(skew) 시 발생할 수 있습니다.
- **해결법**: 앱 안정성을 위해 Expo 자체 교정기를 한 번 돌려줍니다. `npx expo install --fix`
