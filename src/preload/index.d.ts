import { ElectronAPI } from '@electron-toolkit/preload'

interface SessionsIoResult {
  ok: boolean
  canceled?: boolean
  path?: string
  content?: string
}

interface WindowControlsApi {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  exportSessions: (payload: string) => Promise<SessionsIoResult>
  importSessions: () => Promise<SessionsIoResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: WindowControlsApi
  }
}
