const { bookshelf } = require('../db');

const Order = bookshelf.model('Order', {
    tableName: 'orders',
    status() {
        return this.belongsTo('OrderStatus', 'status_id');
    },
    items() {
        return this.hasMany('OrderItem');
    },
    opinions() {
            return this.hasMany('Opinion');
    }
});

module.exports = Order;