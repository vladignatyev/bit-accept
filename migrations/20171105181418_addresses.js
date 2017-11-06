
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('addresses', (table) => {
        table.increments('id').primary()
        table.string('chain')
        table.string('address')
        table.string('account')
        table.integer('index')
        table.dateTime('importTime')
        table.index(['address', 'chain', 'importTime', 'index', 'account']);
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('addresses')
  ])
};
