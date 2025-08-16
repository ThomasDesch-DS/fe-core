import { sentrySvelteKit } from "@sentry/sveltekit";
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
  plugins: [sentrySvelteKit({
    sourceMapsUploadOptions: {
      org: "daisys-secrets",
      project: "fe-core"
    }
  }), sveltekit(), Icons({ compiler: 'svelte', autoInstall: true })],
  optimizeDeps: {
    exclude: ['sortablejs']
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