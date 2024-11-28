exports.up = function (knex) {
    return knex.schema
        .createTable('categories', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
        })
        .createTable('products', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.text('description');
            table.decimal('price', 10, 2).notNullable();
            table.decimal('weight', 10, 2).notNullable();
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
            table.string('phone');
        })
        .createTable('order_items', (table) => {
            table.increments('id').primary();
            table.integer('order_id').unsigned().references('id').inTable('orders');
            table.integer('product_id').unsigned().references('id').inTable('products');
            table.integer('quantity').notNullable();
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('order_items')
        .dropTableIfExists('orders')
        .dropTableIfExists('order_status')
        .dropTableIfExists('products')
        .dropTableIfExists('categories');
};
