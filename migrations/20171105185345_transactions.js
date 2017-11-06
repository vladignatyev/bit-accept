
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('transactions', (table) => {
        table.increments('id').primary()
        table.string('chain')
        table.string('address')
        table.string('txid')
        table.boolean('confirmed')
        table.bigInteger('value')
        table.text('payload')
        table.dateTime('importTime')
        table.index(['address', 'chain', 'importTime', 'txid']);
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('transactions')
  ])
};
