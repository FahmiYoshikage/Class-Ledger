module.exports = {
    apps: [
        {
            name: 'api-server',
            script: './server.js',
            cwd: './server',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            error_file: '~/.pm2/logs/api-server-error.log',
            out_file: '~/.pm2/logs/api-server-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
        {
            name: 'client-dev',
            script: 'npm',
            args: 'run dev',
            cwd: './client',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            autorestart: false,
            env: {
                NODE_ENV: 'development',
            },
            error_file: '~/.pm2/logs/client-dev-error.log',
            out_file: '~/.pm2/logs/client-dev-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
