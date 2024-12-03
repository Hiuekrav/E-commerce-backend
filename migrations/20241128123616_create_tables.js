exports.up = async function (knex) {
    await knex.schema
        .createTable('categories', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
        })
        .createTable('products', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.text('description').notNullable();
            table.decimal('price', 10, 2).notNullable();
            // table.check('price > 0');
            table.decimal('weight', 10, 2).notNullable();
            // table.check('weight > 0');
            table.integer('category_id').unsigned().references('id').inTable('categories');
        })
        .createTable('order_status', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
        })
        .createTable('orders', (table) => {
            table.increments('id').primary();
            table.datetime('approval_date').nullable();
            table.integer('status_id').unsigned().references('id').inTable('order_status');
            table.string('username').notNullable();
            table.string('email').notNullable();
            table.string('phone').notNullable();
        })
        .createTable('order_items', (table) => {
            table.increments('id').primary();
            table.integer('order_id').unsigned().references('id').inTable('orders');
            table.integer('product_id').unsigned().references('id').inTable('products');
            table.integer('quantity').notNullable();
            // table.check('quantity > 0');
        })
        .createTable('users', (table) => {
            table.increments('id').primary();
            table.string('username').unique().notNullable();
            table.string('password').notNullable();
            table.string('email').unique().notNullable();
            table.string('phone').notNullable();
            table.string('role').notNullable();
        });

    // Wstawienie predefiniowanych statusów
    await knex('order_status').insert([
        { name: 'PENDING' },
        { name: 'APPROVED' },
        { name: 'CANCELLED' },
        { name: 'COMPLETED' }
    ]);

    await knex('categories').insert([
        { name: 'Electronics' },
        { name: 'Books' },
        { name: 'Clothing' },
        { name: 'Jewelry' },
        { name: 'Other' }
    ]);

    await knex('users').insert([
        {
            username: 'bfox',
            password: '0e44ce7308af2b3de5232e4616403ce7d49ba2aec83f79c196409556422a4927',
            email: 'bfox@gmail.com',
            phone: '0123456789',
            role: 'WORKER',
        },
        {
            username: 'client',
            password: '0e44ce7308af2b3de5232e4616403ce7d49ba2aec83f79c196409556422a4927',
            email: 'client@gmail.com',
            phone: '9876543221',
            role: 'CLIENT',
        },
    ])
};

exports.down = async function (knex) {
    await knex.schema
        .dropTableIfExists('order_items')
        .dropTableIfExists('orders')
        .dropTableIfExists('order_status')
        .dropTableIfExists('products')
        .dropTableIfExists('categories')
        .dropTableIfExists('users');
};
