const knex = require('knex')(require('./knexfile').development);
const bookshelf = require('bookshelf')(knex);
const fs = require('fs');
const path = require('path');

async function loadInitData() {
    const filePath = path.join(__dirname, 'initData.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
        await knex('products').del();
        await knex.raw(sql);
        console.log('Initialization data loaded successfully');
    } catch (err) {
        console.error('Error loading initialization data:', err.message);
    }
}

module.exports = { knex, bookshelf, loadInitData };
