import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({plugins:[react()],build:{rollupOptions:{output:{manualChunks(id){if(id.indexOf('/node_modules/')<0)return;if(/\/(recharts|d3-[^/]+|victory-vendor)\//.test(id))return 'charts';if(id.indexOf('/@supabase/')>=0)return 'supabase';if(/\/(react|react-dom|scheduler)\//.test(id))return 'react-vendor'}}}}})
