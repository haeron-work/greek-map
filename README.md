# 역사·신화 지도 v1 — 그리스 신화 (오디세우스의 항해)

현대 지도 위에 신화 속 지명·항로를 오버레이하는 정적 웹앱입니다. 빌드 도구나 서버 없이
순수 HTML/CSS/JS + MapLibre GL JS로 동작하며, GitHub Pages에 그대로 올릴 수 있습니다.

## 폴더 구조

```
index.html          메인 페이지
css/style.css        디자인 (잉크 카토그래피 테마)
js/app.js            지도 초기화 · 데이터 로딩 · 항해 기록 패널 로직
data/greek/
  places.json        지명 데이터 (좌표, 고대/현대 이름, 사료 출처, 확실성 등급)
  narrative.json      오디세우스 여정 순서 데이터
```

`js/app.js`는 데이터 스키마가 같으면 다른 이야기(예: 임진왜란)에도 그대로 재사용할 수 있게
`DATA_PATHS`만 바꾸면 되도록 만들어져 있습니다.

## 로컬에서 확인하기

`fetch()`로 로컬 JSON을 불러오기 때문에 `file://`로 그냥 열면 브라우저 CORS 정책에 막힙니다.
반드시 간단한 로컬 서버를 띄워서 확인하세요.

```bash
# 폴더 안에서
python3 -m http.server 8000
# 또는
npx serve .
```

그 다음 브라우저에서 `http://localhost:8000` 접속.

## GitHub Pages에 배포하기

1. 이 폴더 전체를 새 GitHub 저장소에 푸시합니다 (index.html이 저장소 루트에 있어야 함).
2. 저장소 **Settings → Pages**로 이동합니다.
3. **Source**를 `Deploy from a branch`로, 브랜치는 `main` (또는 사용 중인 브랜치), 폴더는 `/ (root)`로 설정합니다.
4. 몇 분 후 `https://<사용자명>.github.io/<저장소명>/`에서 접속 가능합니다.

## 실제 데이터로 교체하기 (지명 소싱)

`places.json`의 각 항목은 아래 필드를 가집니다.

| 필드 | 설명 |
|---|---|
| `id` | 내부 참조용 고유 ID |
| `ancient_name` | 고대 지명 (원어 + 로마자 표기) |
| `modern_name` | 현재 지명 |
| `coords` | `[경도, 위도]` |
| `entity_type` | `city` / `island` / `region` / `hazard` 등 |
| `confidence` | `certain`(실증 확인) / `traditional`(전통적 비정) / `disputed`(위치 논쟁) |
| `description` | 한두 문장 설명 |
| `source` | 사료 인용 (책·장·절 또는 데이터셋 ID) |

**그리스·로마 신화 지명**은 아래 자료에서 좌표와 이형(異形) 지명, 사료 인용을 가져올 수 있습니다.

- **Pleiades** (`https://pleiades.stoa.org`) — 고대 세계 가제티어, GeoJSON/KML 다운로드 제공. 장소별 영구 URI가 있어 `source` 필드에 그대로 인용하기 좋습니다.
- **Perseus Digital Library** — 원문 대조, 지명 이형 확인.
- **World Historical Gazetteer** (`https://whgazetteer.org`) — Pleiades를 포함한 여러 시대·지역의 지명 데이터를 시간 슬라이더와 함께 제공.

신화 속 지명처럼 위치 자체가 논쟁적인 경우, 무리하게 하나의 좌표로 단정하지 말고
`confidence: "disputed"`로 표시하고 `description`에 그 이유를 짧게 남기는 걸 권장합니다.
(이번 오디세우스 데이터에서도 로토파고이족의 땅, 키클로페스의 땅, 오귀기아 등은 `disputed`로 표시했습니다.)

## 다음 확장 (조선 / 임진왜란 편)

동일한 스키마로 `data/joseon/places.json`, `data/joseon/narrative.json`을 만들고
`js/app.js`의 `DATA_PATHS`만 바꾸면 됩니다. 조선시대 지명·행정구역은 규장각 역사지리정보
서비스(`https://kyudb.snu.ac.kr`)의 대동여지도·해동지도 디지털화 자료를 참고하면 됩니다.
행정구역처럼 면(폴리곤) 데이터가 필요해지면 `places.json` 옆에 `boundaries/*.geojson`을
추가하고 `map.addLayer`로 `fill` 레이어를 하나 더 얹는 식으로 확장하면 됩니다.
