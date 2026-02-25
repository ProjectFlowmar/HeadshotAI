const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3003;
const CLOUDFLARED = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe';
const ENV_PATH = path.join(__dirname, '.env');

function startTunnel() {
  console.log(`[Tunnel] Starting Cloudflare tunnel for port ${PORT}...`);

  const proc = spawn(CLOUDFLARED, ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const handleOutput = (data) => {
    const line = data.toString();
    const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      console.log(`[Tunnel] ✅ URL: ${url}`);
      
      // Update .env
      let env = fs.readFileSync(ENV_PATH, 'utf8');
      env = env.replace(/^BASE_URL=.*/m, `BASE_URL=${url}`);
      fs.writeFileSync(ENV_PATH, env);
      console.log(`[Tunnel] Updated .env BASE_URL`);
    }
    if (line.trim()) console.log(`[Tunnel] ${line.trim()}`);
  };

  proc.stdout.on('data', handleOutput);
  proc.stderr.on('data', handleOutput);
  proc.on('close', (code) => {
    console.log(`[Tunnel] Exited with code ${code}, restarting in 5s...`);
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
