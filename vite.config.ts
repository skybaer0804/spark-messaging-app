import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [preact()],
    preview: {
        host: '0.0.0.0',
        port: Number(process.env.PORT) || 5173,
        // 배포 환경에서 호스트 차단 방지
        allowedHosts: [
            'moral-vicki-spark-messasing-8f9488e5.koyeb.app',
            '.koyeb.app', // 모든 koyeb.app 서브도메인 허용
        ],
    },
});
