module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: './sklep.sqlite'
        },
        useNullAsDefault: true, // Wymagane dla SQLite
        migrations: {
            directory: './migrations'
        }
    }
};