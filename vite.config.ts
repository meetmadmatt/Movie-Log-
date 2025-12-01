import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Use the provided key as a fallback if not in .env
  const API_KEY = env.API_KEY || "4c7701a91cf42adf693c5cd614951311";

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY is available in your client-side code
      'process.env.API_KEY': JSON.stringify(API_KEY)
    }
  }
})