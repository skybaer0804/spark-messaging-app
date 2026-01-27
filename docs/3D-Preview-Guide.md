# Preact + Vite + Three.js 채팅앱 3D 모델 프리뷰 구현 가이드

## 목차
1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [아키텍처](#아키텍처)
4. [구현 단계](#구현-단계)
5. [코드 예제](#코드-예제)
6. [성능 최적화](#성능-최적화)
7. [트러블슈팅](#트러블슈팅)

---

## 개요

채팅 앱에서 3D 모델 파일(STL, OBJ, PLY)을 업로드하면:
1. **서버**: 원본 저장 + 저해상도 썸네일 생성
2. **클라이언트**: 썸네일 Three.js로 프리뷰 렌더링
3. **상호작용**: 클릭 시 원본 모달 열기 또는 다운로드 링크 제공

**대상 파일 크기**: 통상 200MB, 최대 500MB 원본 파일

---

## 기술 스택

```
Frontend:
- Preact (경량 React 대체)
- Vite (고속 빌드)
- Three.js (3D 렌더링)
- TypeScript (타입 안전성)

Backend:
- Node.js/Express (API)
- 3D 변환 라이브러리:
  - assimp (STL/OBJ/PLY → compressed GLTF)
  - sharp (썸네일 이미지 생성)
  - meshopt (메시 압축)
```

---

## 아키텍처

### 파일 흐름

```
User Upload
     ↓
[Client] FileInput → Preact Component
     ↓
[Server] Validate + Store
     ├─ Original: /uploads/original/{id}.{stl|obj|ply}
     ├─ Thumbnail: /uploads/thumbs/{id}.glb (compressed)
     └─ Preview Image: /uploads/preview/{id}.png (2D screenshot)
     ↓
[Client] Chat Message
     ├─ Thumbnail URL (render in chat)
     ├─ Original URL (download link)
     └─ Preview Image (fallback)
     ↓
[Interaction]
     ├─ Click Thumbnail → Full 3D Model Modal
     └─ Click Download → Original File Download
```

### 데이터베이스 스키마

```sql
CREATE TABLE chat_files (
  id UUID PRIMARY KEY,
  message_id UUID,
  file_name VARCHAR(255),
  file_type ENUM('stl', 'obj', 'ply'),
  original_size INT,
  thumbnail_size INT,
  original_url VARCHAR(512),
  thumbnail_url VARCHAR(512),
  preview_image_url VARCHAR(512),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 구현 단계

### 1단계: 서버 설정 (Node.js/Express)

#### 1.1 의존성 설치

```bash
npm install express multer sharp assimp-js
npm install --save-dev @types/express @types/multer
```

#### 1.2 파일 업로드 API

```typescript
// server/routes/files.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'original');
    fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.stl', '.obj', '.ply'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  },
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = path.parse(req.file.filename).name;
    const fileType = path.extname(req.file.originalname).slice(1);
    const originalSize = req.file.size;

    // 썸네일 생성 (비동기 처리)
    generateThumbnail(req.file.path, fileId, fileType).catch(console.error);

    res.json({
      success: true,
      fileId,
      fileName: req.file.originalname,
      fileType,
      originalSize,
      originalUrl: `/api/files/download/${fileId}`,
      thumbnailUrl: `/api/files/thumbnail/${fileId}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
```

#### 1.3 썸네일 생성 함수

```typescript
// server/utils/thumbnail.ts
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function generateThumbnail(
  filePath: string,
  fileId: string,
  fileType: string
): Promise<string> {
  const thumbDir = path.join(process.cwd(), 'uploads', 'thumbs');
  await fs.mkdir(thumbDir, { recursive: true });

  const thumbPath = path.join(thumbDir, `${fileId}.glb`);

  try {
    // assimp CLI로 STL/OBJ/PLY → GLTF 변환
    const cmd = `assimp export ${filePath} ${thumbPath} -scale 0.1 --triangulate`;
    await execPromise(cmd);

    // Draco 압축 적용 (선택사항)
    // const compressCmd = `gltf-pipeline -i ${thumbPath} -o ${thumbPath} -d`;
    // await execPromise(compressCmd);

    console.log(`Thumbnail created: ${thumbPath}`);
    return thumbPath;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw error;
  }
}
```

**대안 (Python 사용 권장 - 더 나은 호환성)**:

```python
# server/scripts/generate_thumbnail.py
import subprocess
import sys
from pathlib import Path

def generate_thumbnail(input_file: str, output_file: str):
    """
    Assimp 또는 OpenCascade를 이용한 변환
    STL/OBJ/PLY → GLB (GLTF binary format)
    """
    # assimp 설치: pip install pyassimp
    cmd = [
        "assimp", "export",
        input_file,
        output_file,
        "-scale", "0.1",  # 10% 축소
        "-t",  # 삼각형화
        "-vn",  # 법선 벡터 계산
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Conversion failed: {result.stderr}")
    
    return output_file

if __name__ == "__main__":
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    generate_thumbnail(input_file, output_file)
```

#### 1.4 다운로드/프리뷰 API

```typescript
// server/routes/files.ts (계속)
router.get('/download/:fileId', (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(process.cwd(), 'uploads', 'original', fileId);

    // 보안: 경로 트래버설 방지
    const normalizedPath = path.normalize(path.resolve(filePath));
    const uploadDir = path.normalize(path.resolve(process.cwd(), 'uploads'));
    
    if (!normalizedPath.startsWith(uploadDir)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 파일 확장자 추가
    const files = fs.readdirSync(path.dirname(filePath));
    const file = files.find(f => f.startsWith(fileId));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fullPath = path.join(path.dirname(filePath), file);
    res.download(fullPath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.get('/thumbnail/:fileId', (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;
    const thumbPath = path.join(process.cwd(), 'uploads', 'thumbs', `${fileId}.glb`);
    
    if (!fs.existsSync(thumbPath)) {
      // 아직 생성 중이면 대기 중 상태 반환
      return res.status(202).json({ status: 'generating' });
    }

    res.setHeader('Content-Type', 'model/gltf-binary');
    res.sendFile(thumbPath);
  } catch (error) {
    console.error('Thumbnail fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch thumbnail' });
  }
});
```

---

### 2단계: 클라이언트 설정 (Preact + Vite)

#### 2.1 의존성 설치

```bash
npm install three
npm install --save-dev @types/three
```

#### 2.2 Vite 설정

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import preact from '@preactjs/preset-vite';

export default defineConfig({
  plugins: [preact()],
  optimizeDeps: {
    include: ['three'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
});
```

#### 2.3 3D 모델 뷰어 컴포넌트

```typescript
// src/components/ModelViewer.tsx
import { h, Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ModelViewerProps {
  modelUrl: string;
  width?: number;
  height?: number;
  interactive?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const ModelViewer = ({
  modelUrl,
  width = 400,
  height = 300,
  interactive = true,
  onLoad,
  onError,
}: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene 초기화
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      10000
    );
    camera.position.set(0, 0, 100);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // OrbitControls
    if (interactive) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2;
      controlsRef.current = controls;
    }

    // 모델 로드
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // 바운딩박스 계산 후 자동 카메라 조정
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        cameraZ *= 1.5; // 여유 공간
        camera.position.z = cameraZ;
        camera.lookAt(model.position);

        scene.add(model);
        setLoading(false);
        onLoad?.();
      },
      (progress) => {
        console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (err) => {
        const errorMsg = `Failed to load model: ${err.message}`;
        setError(errorMsg);
        onError?.(new Error(errorMsg));
        setLoading(false);
      }
    );

    // 애니메이션 루프
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 창 크기 조정
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);
      }
    };
    window.addEventListener('resize', handleResize);

    // 정리
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl, width, height, interactive, onLoad, onError]);

  if (loading) {
    return <div style={{ width, height }} class="flex items-center justify-center bg-gray-100">
      <p>로딩 중...</p>
    </div>;
  }

  if (error) {
    return <div style={{ width, height }} class="flex items-center justify-center bg-red-100">
      <p class="text-red-600">{error}</p>
    </div>;
  }

  return <div ref={containerRef} style={{ width, height }} />;
};
```

#### 2.4 채팅 메시지 컴포넌트

```typescript
// src/components/ChatMessage.tsx
import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { ModelViewer } from './ModelViewer';

interface FileAttachment {
  id: string;
  fileName: string;
  fileType: 'stl' | 'obj' | 'ply';
  originalUrl: string;
  thumbnailUrl: string;
}

interface ChatMessageProps {
  text: string;
  attachment?: FileAttachment;
  timestamp: Date;
  author: string;
}

export const ChatMessage = ({
  text,
  attachment,
  timestamp,
  author,
}: ChatMessageProps) => {
  const [showFullModel, setShowFullModel] = useState(false);

  return (
    <div class="flex gap-3 mb-4">
      <div class="flex-1">
        <div class="text-sm text-gray-500 mb-1">
          <strong>{author}</strong> · {timestamp.toLocaleTimeString()}
        </div>

        {text && <p class="mb-2">{text}</p>}

        {attachment && (
          <div class="border rounded-lg overflow-hidden bg-gray-50 p-2">
            <div class="flex gap-2">
              {/* 썸네일 프리뷰 */}
              <div
                class="cursor-pointer flex-shrink-0"
                onClick={() => setShowFullModel(true)}
              >
                <ModelViewer
                  modelUrl={attachment.thumbnailUrl}
                  width={150}
                  height={150}
                  interactive={false}
                />
              </div>

              {/* 파일 정보 및 다운로드 */}
              <div class="flex flex-col justify-between flex-1 p-2">
                <div>
                  <p class="text-sm font-medium">{attachment.fileName}</p>
                  <p class="text-xs text-gray-500">{attachment.fileType.toUpperCase()} 파일</p>
                </div>
                <a
                  href={attachment.originalUrl}
                  download={attachment.fileName}
                  class="inline-block px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  다운로드
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 풀 모델 모달 */}
      {showFullModel && attachment && (
        <div
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFullModel(false)}
        >
          <div
            class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold">{attachment.fileName}</h2>
              <button
                onClick={() => setShowFullModel(false)}
                class="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <ModelViewer
              modelUrl={attachment.thumbnailUrl}
              width={600}
              height={500}
              interactive={true}
            />

            <div class="mt-4 flex gap-2">
              <a
                href={attachment.originalUrl}
                download={attachment.fileName}
                class="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600"
              >
                원본 다운로드
              </a>
              <button
                onClick={() => setShowFullModel(false)}
                class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 2.5 파일 업로드 컴포넌트

```typescript
// src/components/FileUpload.tsx
import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';

interface UploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  fileType: string;
  originalSize: number;
  originalUrl: string;
  thumbnailUrl: string;
}

interface FileUploadProps {
  onFileUploaded: (file: UploadResponse) => void;
  onError: (error: string) => void;
}

export const FileUpload = ({ onFileUploaded, onError }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowedTypes = ['stl', 'obj', 'ply'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !allowedTypes.includes(ext)) {
      onError(`지원하지 않는 파일 형식: ${ext}`);
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      onError('파일 크기가 500MB를 초과합니다');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText) as UploadResponse;
          onFileUploaded(response);
          setProgress(0);
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        } else {
          onError(`업로드 실패: ${xhr.status}`);
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        onError('업로드 중 오류가 발생했습니다');
        setUploading(false);
      });

      xhr.open('POST', '/api/files/upload');
      xhr.send(formData);
    } catch (error) {
      onError(`오류: ${error instanceof Error ? error.message : 'unknown'}`);
      setUploading(false);
    }
  };

  return (
    <div class="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".stl,.obj,.ply"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {uploading ? `업로드 중... ${progress}%` : '파일 선택'}
      </button>
    </div>
  );
};
```

---

## 성능 최적화

### 1. 썸네일 생성 최적화

```typescript
// 해상도 감소 + 삼각형 분해
const cmd = `assimp export ${filePath} ${thumbPath} \
  -scale 0.1 \
  --triangulate \
  --verbose-output`;

// Draco 압축 추가
// GLB 최종 크기: 원본 100MB → 5-10MB
```

### 2. 청크 다운로드

```typescript
// 서버: 범위 요청 지원
router.get('/download/:fileId', (req, res) => {
  const filePath = /* ... */;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream',
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.header('Accept-Ranges', 'bytes');
    fs.createReadStream(filePath).pipe(res);
  }
});
```

### 3. 클라이언트 캐싱

```typescript
// IndexedDB에 로드한 모델 캐시
const DB_NAME = 'ModelCache';
const STORE_NAME = 'models';

async function cacheModel(modelId: string, arrayBuffer: ArrayBuffer) {
  const db = await openDB(DB_NAME);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put({ id: modelId, data: arrayBuffer });
}

async function getCachedModel(modelId: string) {
  const db = await openDB(DB_NAME);
  return db.get(STORE_NAME, modelId);
}

// ModelViewer에서 사용
const loadModel = async (url: string, modelId: string) => {
  let arrayBuffer = await getCachedModel(modelId);
  if (!arrayBuffer) {
    const response = await fetch(url);
    arrayBuffer = await response.arrayBuffer();
    await cacheModel(modelId, arrayBuffer);
  }
  return loader.parse(arrayBuffer);
};
```

### 4. 메모리 관리

```typescript
// WebGL 메모리 정리
useEffect(() => {
  return () => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (sceneRef.current) {
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    }
  };
}, []);
```

---

## 트러블슈팅

### 문제: "모델이 검은색으로 나타남"

**원인**: 조명 부족 또는 카메라 위치 오류

**해결**:
```typescript
// 조명 추가
scene.add(new THREE.AmbientLight(0xffffff, 1));
scene.add(new THREE.DirectionalLight(0xffffff, 1));

// 카메라 위치 재설정
camera.position.set(0, 0, 150);
camera.lookAt(0, 0, 0);
```

### 문제: "Draco 압축 파일 로드 안 됨"

**원인**: Draco 디코더 경로 미설정

**해결**:
```typescript
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/draco_wasm_wrapper_gltf.js');
loader.setDRACOLoader(dracoLoader);
```

### 문제: "메모리 부족 - 모바일에서 크래시"

**해결**:
- 썸네일 크기 더 줄이기 (스케일 0.05-0.1)
- 메시 병합 (mergeGeometries)
- 저폴리 모델만 로드

### 문제: "파일 업로드 중 브라우저 멈춤"

**해결**:
```typescript
// Web Worker로 파싱 오프로드
const worker = new Worker(new URL('./modelWorker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ arrayBuffer });
worker.onmessage = (e) => {
  const { geometry } = e.data;
  // geometry 사용
};
```

---

## 체크리스트

- [ ] 서버 파일 업로드 API 구현 (multer)
- [ ] Assimp CLI 또는 Python 썸네일 생성 스크립트 설치
- [ ] 데이터베이스 스키마 생성
- [ ] Preact + Vite 환경 설정
- [ ] Three.js GLTFLoader 임포트
- [ ] ModelViewer 컴포넌트 작성
- [ ] ChatMessage 컴포넌트에 파일 렌더링
- [ ] FileUpload 컴포넌트 통합
- [ ] 시큐리티: 파일 경로 검증, 파일 타입 화이트리스트
- [ ] 테스트: 100MB, 200MB, 500MB 파일로 성능 확인
- [ ] 에러 핸들링 및 로깅
- [ ] 모바일 반응형 디자인

---

## 추가 리소스

- Three.js 공식 문서: https://threejs.org/docs/
- GLTFLoader: https://threejs.org/docs/index.html?q=gltf#examples/en/loaders/GLTFLoader
- Assimp: https://github.com/assimp/assimp
- DRACOLoader: https://github.com/google/draco

---

## 예상 비용 (AWS 기준)

| 항목 | 비용 |
|------|------|
| S3 저장소 (1TB) | ~$23/월 |
| EC2 t3.medium (썸네일 생성) | ~$30/월 |
| CloudFront (배포) | ~$0.085/GB |
| **총 예상** | **~$50-100/월** (100-500 사용자) |

---

**마지막 업데이트**: 2026년 1월 27일