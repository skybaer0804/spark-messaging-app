/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_SPARK_SOCKET_URL: string;
  readonly VITE_SPARK_PROJECT_KEY: string;
  readonly VITE_MEETING_MAX_PARTICIPANTS?: string;
  readonly VITE_MEETING_MAX_VIDEO_STREAMS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
