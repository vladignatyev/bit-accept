let debug = require('debug')('bitaccept:BlockParser')
let _ = require('lodash')

// let sequence = require('./utils').promiseSequence

let Queue = require('promise-queue')


const DELAY = 1000  // 1000 ms before parsing next block

let _delay = () => {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, DELAY)
  });
}

class BlockParser {
  constructor(chain, db, manager) {
    this.chain = chain
    this.db = db
    this.manager = manager

    this.q = new Queue(1, Infinity)
  }

  processBlocks() {
    debug(`Processing unprocessed blocks`)
    const self = this

    const _chain = this.chain
    const _db = this.db
    const _q = this.q
    const _manager = this.manager


    return Promise.all([_db.getAllUsedAddresses(), _db.getUnprocessedBlocks()]).then((result) => {
      let addresses = result[0]
      let blocks = result[1]
      debug(`${blocks.length} blocks to process for ${addresses.length} known address.`)

      let addressesPlainList = _.map(addresses, 'address')  // todo: use Bloem Filter for fast search

      for (var i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        _q.add(() => {
          return _manager.getDepositsFromBlock(block.hash).then((deposits) => {
            debug(`Block ${block.hash} has ${deposits.length} transactions.`)
             let promises = []
             let transactions = []
             for (var o = 0; o < deposits.length; o++) {
               let deposit = deposits[o]

               if (addressesPlainList.indexOf(deposit.address) < 0) continue  // todo: use Bloem Filter for fast search

               debug(`Found transaction to known address ${deposit.address}, with txid ${deposit.txhash}`)
               let txObj = {
                 'address': deposit.address,
                 'txid': deposit.txhash,
                 'confirmed': true,
                 'value': deposit.value,
                 'payload': '',
                 'importTime': new Date()
               }

               transactions.push(_db.createTransaction(_chain, txObj))
             }
             _q.add(_delay)

             return Promise.all(transactions)
           }).then((transactionsSaved) => {
             console.log(transactionsSaved);
             debug(`Confirmed block ${block.hash}`)
             return _db.confirmBlock(_chain, block.hash)
           }).catch((err) => {
             debug(err)
           })
        })
      }

      _q.add(() => {
        debug(`Txs processed for known blocks. `)
      })

      return new Promise(function(resolve, reject) {
        setInterval(() => {
          if (_q.getQueueLength() == 0) resolve()
        }, 100)
      });
    }).catch((err) => { debug(err)})
  }
}


class BlockLoader {
  constructor(chain, db, manager, startBlockTime) {
    this.chain = chain
    this.db = db
    this.manager = manager
    this.startBlockTime = startBlockTime
  }

  loadBlocks() {
    const _db = this.db
    const _chain = this.chain

    debug(`Obtaining latest saved block...`)

    return _db.getLatestAddedBlock().then((blocks) => {
      if (blocks.length === 1) {
        let block = blocks[0]
        debug(`Found latest saved block ${block.hash}`)
        this.startBlockTime = block.time
      } else {
        debug(`No saved blocks found.`)
      }
      debug(`Loading new blocks since ${this.startBlockTime.toString()}`)
    }).then(() => {
      return this.manager.getLatestBlocks(this.startBlockTime)
    }).then((blocks) => {
      if (blocks.length === 0) {
        debug(`No new blocks mined yet.`)
        return
      }

      debug(`[${this.chain}] loaded ${blocks.length} new blocks, block #1 is "${blocks[0].hash} with height ${blocks[0].height}"`)
      return Promise.all(_.map(blocks, (block) => {
        debug(`Saving ${block.hash} from '${this.chain}', height ${block.height}`)
        return _db.addParsedBlock(_chain, block).catch((err) => {
          debug(err)
        })
      }))
    })
  }
}

//todo:
// Сделать две отдельных Task:
// + загрузка блоков по времени с момента последнего обработанного блока
// - парсинг одного не распарсенного блока из БД:
  // - сделать загрузку и парсинг именно однго блока
  // -


// - оформить в виде двух отдельных команд, чтобы можно было supervisord использовать для их запуска
// - убедиться что транзакици небоходимые создаются и балансы обновляются
// - обернуть в либу чтобы таскать в другой проект (создать проект на Express'е с Дашбордом ICO)

module.exports = {
  'BlockLoader': BlockLoader,
  'BlockParser': BlockParser
}


// module.exports = BlockParser
