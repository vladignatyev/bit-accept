var DatabaseBroker = require('../src/core/db')
var fs = require('fs');

var filename = process.argv[2];

if (!filename) {
  console.log('No .csv file provided.');
  process.exit(1);
}

console.log('Importing Bitcoin addresses from "' + filename + '"...\n');

fs.readFile(filename, 'utf8', (err, data) => {
  if (err) {
    console.error(err.message);
    process.exit(255);
  }

  let lines = data.split('\n')



  let addresses = []

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    var chunks = line.split('\t')
    if (chunks.length < 2) break;
    addresses.push({index: chunks[0] | 0, address: chunks[1]})
  }

  console.log(`Found ${addresses.length} addresses.`);

  let db = new DatabaseBroker()

  db.addAddresses('bitcoin', addresses).then((ids) => {
    console.log(ids);
    console.log('Well done.');
    process.exit(0)
  })
});
