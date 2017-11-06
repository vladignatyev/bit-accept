let fs = require('fs');
let bulkGenerateAddresses = require('../src/core/core.js').bulkGenerateAddresses;

let count = (process.argv[2] |0) || 100;
let startIndex = (process.argv[3] |0) || 1;
let fileout = process.argv[4] || 'bulkaddresses.csv';

console.log('ATTENTION! YOU SHOULD BE IN SECURE ENVIRONMENT IN ORDER TO RUN THIS TOOL.');

console.log('Type down your mnemonic phrase, word-by-word and then press Enter:');

process.stdin.on('data', function(data){
  const userInput = data.toString();
  const mnemonic = userInput.replace('\n', '').replace('\r','').split(' ').join(' ');

  if (mnemonic === '') console.log('...using random mnemonic');
  var routine = bulkGenerateAddresses(count, startIndex, mnemonic);

  console.log('===============================');
  console.log('Write down the mnemonic: ');

  var m;

  let fd = fs.openSync(fileout, 'a');
  var item;
  while (item = routine.next()) {
    if (item.done) {
      fs.closeSync(fd)
      console.log(' Well done!');
      process.exit(0);
    }

    if (!m) {
      m = item.value.mnemonic
      console.log(m);
      console.log('===============================');
    }

    fs.writeSync(fd, item.value.index + '\t'+ item.value.address + '\n');
  }
});
