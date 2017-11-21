
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('blocks', (table) => {
      table.increments('id').primary()
      table.string('chain')
      table.string('hash')
      table.integer('height')
      table.dateTime('time')
      table.dateTime('processedTime')
      table.index(['hash', 'chain', 'height', 'time']);
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('blocks')
  ])
};
