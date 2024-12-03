const { bookshelf } = require('../db');

const User = bookshelf.model('User', {
    tableName: 'users',
});

module.exports = User;