import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    Icons({ compiler: 'svelte', autoInstall: true }),
  ],
  optimizeDeps: {
    exclude: ['sortablejs']
  },
  build: {
    rollupOptions: {
      external: ['posthog-js']
    }
  },
  server: {
    fs: {
      allow: ['./static']
    }
  },
  ssr: {
    // 👇 Add this line
    noExternal: ['svelte-chartjs']
  }
})
