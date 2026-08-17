module.exports = {
  apps: [
    {
      name: 'tg4you-api',
      cwd: __dirname,
      script: './server/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      max_memory_restart: '350M',
    },
    {
      name: 'tg4you-web',
      cwd: `${__dirname}/client`,
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3101',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '450M',
    },
  ],
};
