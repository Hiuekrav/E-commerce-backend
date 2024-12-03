const { bookshelf } = require('../db');

const Opinion = bookshelf.model('Opinion', {
    tableName: 'opinions',
    order() {
        return this.belongsTo('Order', 'order_id');
    },
});

module.exports = Opinion;
