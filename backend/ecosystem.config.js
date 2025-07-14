module.exports = {
  apps: [{
    name: "nursing-backend",
    script: "./app.js",           // Main application server
    instances: "max",             // Use all available CPU cores for better performance
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    // Error handling and logging
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    
    // Automatic restart settings
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
    min_uptime: "30s",
    
    // Graceful shutdown
    kill_timeout: 3000,
    wait_ready: true,
    
    // Memory management
    node_args: "--max-old-space-size=1024",
    
    // Monitoring
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    
    // Health check
    listen_timeout: 8000,
    shutdown_with_message: true,
    
    // Restart on specific conditions
    restart_delay: 4000,
    autorestart: true,
    
    // Environment variables
    env_production: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}; 