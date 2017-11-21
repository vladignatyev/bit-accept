let debug = require('debug')('bitaccept:BlockParser')
let _ = require('lodash')

// let sequence = require('./utils').promiseSequence

let Queue = require('promise-queue')


const DELAY = 1000

let _delay = () => {
  return new new Promise(function(resolve, reject) {
    setTimeout(resolve, DELAY)
  });
}

class BlockParser {
  constructor(db, manager, chain, startBlockTime) {
    this.db = db
    this.manager = manager
    this.chain = chain
    this.startBlockTime = startBlockTime
    this.stopped = false

    this.queue = new Queue(1, Infinity)
  }

  parseBlocks() {
    debug(`Parsing blocks...`)
    const _db = this.db

    return Promise.all([
      _db.getLatestProcessedBlock(),
      _db.getUnprocessedBlocks()
    ], 500).then((blocks) => {

      let latestProcessedBlock = blocks[0]
      let unprocessedBlocks = blocks[1]

      if (latestProcessedBlock.length === 1) {
        this.startBlockTime = latestProcessedBlock[0].time
        debug(`[${this.chain}] latest block is "${latestProcessedBlock[0].hash}", height ${latestProcessedBlock[0].height}, time ${latestProcessedBlock[0].time}`)
      } else debug(`No blocks processed yet.`)

      return this.processBlocks().then(this.loadNewBlocks.bind(this))
    })
  }

  loadNewBlocks() {
    debug(`Loading new blocks`)

    const _db = this.db
    const _chain = this.chain

    return this.manager.getLatestBlocks(this.startBlockTime).then((blocks) => {
      debug(`[${this.chain}] loaded ${blocks.length} new blocks, block #1 is "${blocks[0].hash} with height ${blocks[0].height}"`)
      return Promise.all(_.map(blocks, (block) => {
        debug(`Saving loaded block ${block.hash} with height ${block.height}`)
        return _db.addParsedBlock(_chain, block).catch((err) => {
          debug(err)
        })
      }))
    })
  }

  processBlocks() {
    debug(`Processing unprocessed blocks`)
    const self = this

    const _chain = this.chain
    const _db = this.db
    const _q = this.queue
    const _manager = this.manager


    return Promise.all([_db.getAllUsedAddresses(), _db.getUnprocessedBlocks()]).then((result) => {
      let addresses = result[0]
      let blocks = result[1]
      debug(`${blocks.length} blocks to process for ${addresses.length} known address.`)

      let addressesPlainList = _.map(addresses, 'address')

      for (var i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        _q.add(() => {
          return _manager.getDepositsFromBlock(block.hash).then((deposits) => {
             let promises = []
             let transactions = []
             for (var o = 0; o < deposits.length; o++) {
               let deposit = deposits[o]

               if (addressesPlainList.indexOf(deposit.address) < 0) continue

               let txObj = {
                 'address': deposit.address,
                 'txid': deposit.txhash,
                 'confirmed': true,
                 'value': deposit.value,
                 'payload': '',
                 'importTime': new Date()
               }

               transactions.push(_db.createTransaction.bind(_db, _chain, txObj))
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

  stop() {
    this.stopped = true
  }

  run() {
    debug(`Started blockparser process.`)
    if (this.stopped) {
      debug(`Blockparser stopped.`)
      this.stopped = false
      return
    }

    let self = this

    new Promise(function(resolve, reject) {
      return self.parseBlocks().then(() => {
        if (self.stopped) {
          resolve()
          return
        }
        return self.parseBlocks().then(() => {
          setTimeout(() => {
            self.run()
          }, 1000)
        }).then(resolve).catch(reject)
      }).catch(reject)
    }).catch((err) => console.log(err))
  }
}

//todo:
// Сделать две отдельных Task:
// - загрузка блоков по времени с момента последнего обработанного блока
// - парсинг одного не распарсенного блока из БД
// - оформить в виде двух отдельных команд, чтобы можно было supervisord использовать для их запуска
// - убедиться что транзакици небоходимые создаются и балансы обновляются
// - обернуть в либу чтобы таскать в другой проект (создать проект на Express'е с Дашбордом ICO)

module.exports = BlockParser
