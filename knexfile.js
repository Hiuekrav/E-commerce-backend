module.exports = {
    development: {
        client: 'pg',
        connection: {
            host: '127.0.0.1',
            user: 'user',
            password: 'admin',
            database: 'sklepPG'
        },
        migrations: {
            directory: './migrations'
        }
    }
};