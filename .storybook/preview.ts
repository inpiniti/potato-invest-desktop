import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

// Mock Electron IPC
if (typeof window !== 'undefined') {
  window.ipcRenderer = {
    invoke: (channel: string, ...args: any[]) => {
      console.log(`IPC invoked: ${channel}`, args)
      return Promise.resolve(null)
    },
    on: (channel: string, listener: any) => {
        console.log(`IPC listener added: ${channel}`)
        return { dispose: () => {} }
    },
    removeListener: (channel: string, listener: any) => {
        console.log(`IPC listener removed: ${channel}`)
    },
    // Add other methods if used
    send: (channel: string, ...args: any[]) => {},
    off: (channel: string, listener: any) => {},
     // ... mock other used methods
  } as any
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
