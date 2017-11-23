exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('blocks', (table) => {
      table.increments('id').primary()
      table.string('chain')
      table.string('hash')
      table.integer('height')
      table.dateTime('time')
      table.dateTime('processedTime')
      table.index(['hash', 'chain', 'height', 'time'])
    }),

    knex.schema.createTable('addresses', (table) => {
        table.increments('id').primary()
        table.string('chain')
        table.string('address')
        table.string('account')
        table.integer('index')
        table.dateTime('importTime')
        table.index(['address', 'chain', 'importTime', 'index', 'account']);
      }),

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
    knex.schema.dropTable('blocks'),
    knex.schema.dropTable('addresses'),
    knex.schema.dropTable('transactions')
  ])
};
