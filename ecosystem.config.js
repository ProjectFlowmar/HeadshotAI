module.exports = {
  apps: [
    {
      name: 'headshotai',
      script: 'server.js',
      cwd: __dirname,
      env: { PORT: 3003 },
      watch: false,
    },
    {
      name: 'headshotai-tunnel',
      script: 'cf-tunnel.js',
      cwd: __dirname,
      env: { PORT: 3003 },
      watch: false,
    },
  ],
};
