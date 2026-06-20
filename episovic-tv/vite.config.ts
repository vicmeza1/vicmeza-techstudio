import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const DATA_FILE = path.resolve(process.cwd(), 'series-data.json')

export default defineConfig({
  server: {
    host: true,   // expose to local network so iPhone can connect
    watch: {
      ignored: ['**/series-data.json'],
    },
  },
  plugins: [
    react(),
    {
      name: 'series-data',
      configureServer(server) {
        server.middlewares.use('/api/series', (req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          if (req.method === 'OPTIONS') { res.end(); return }

          if (req.method === 'GET') {
            if (!fs.existsSync(DATA_FILE)) {
              res.statusCode = 404; res.end('null'); return
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(fs.readFileSync(DATA_FILE, 'utf-8'))
            return
          }

          if (req.method === 'PUT') {
            let body = ''
            req.on('data', (chunk: Buffer) => { body += chunk })
            req.on('end', () => {
              fs.writeFileSync(DATA_FILE, body, 'utf-8')
              // Broadcast to ALL connected browsers in real-time
              server.ws.send({ type: 'custom', event: 'series:sync', data: body })
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            })
            return
          }
          next()
        })
      },
    },
  ],
})
