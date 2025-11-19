module.exports = {
  apps : [
    {
      name   : "healthtrack-api",
      script : "./server/index.cjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "production",
        PORT: 3004
      },
      // Log date format
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name   : "healthtrack-frontend",
      script : "npm",
      args   : "run dev",
      cwd    : ".",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "development"
      },
      // Log date format
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
}