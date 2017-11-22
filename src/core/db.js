let _ = require('lodash')
let knexObj = require('../db/knex')


class DatabaseBroker {
  constructor(kn) {
    this.knex = kn || knexObj
  }

  getAllTransactionsByAccount(accountName) {
    return this.getAddressesForAccount(accountName).then((addrObjects) => {
      let addrList = _.map(addrObjects, (o) => { return o.address })
      return this.knex('transactions').whereIn('address', addrList)
    })
  }

  getAddressesForAccount(accountName) {
    return this.knex('addresses').where('account', accountName).map((row) => {
      return {
        'chain': row.chain,
        'address': row.address
      }
    })
  }

  getOrChooseAddressForAccount(chain, accountName) {
    return this.knex.transaction((trx) => {
      return this.knex('addresses').transacting(trx).forUpdate().where({
          'account': accountName,
          'chain': chain
        })
        .then((addrObjects) => {
          if (addrObjects.length > 0)
            return addrObjects[0].address
          else
            return this.knex('addresses').transacting(trx).forUpdate().where({'account': '', 'chain': chain}).orderBy('importTime').limit(1).returning('id').then((objs) => {
              if (objs.length < 1) throw new Error('There are no free addresses available')
              return this.knex('addresses').transacting(trx).where('id', objs[0].id).update('account', accountName).returning('address').then((addresses) => {
                return addresses[0]
              })
            })
        }).then(trx.commit).catch(trx.rollback)
    })
  }

  confirmTransaction(chain, txid, address) {
    return this.knex.transaction((trx) => {
      return this.knex('transactions').transacting(trx).where({
        'chain': chain,
        'txid': txid,
        'address': address
      }).update({'confirmed': true}).then(trx.commit).catch(trx.rollback)
    })
  }

  createTransaction(chain, transaction) {
    let transactionObj = {
      'chain': chain,
      'address': transaction.address,
      'txid': transaction.txid,
      'confirmed': transaction.confirmed,
      'value': transaction.value,
      'payload': transaction.payload,
      'importTime': transaction.importTime
    }

    return this.knex.transaction((trx) => {

      return this.knex('addresses').transacting(trx).forUpdate().where('address', transactionObj.address).then((result) => {
        if (result.length === 0) return trx.commit() // should not create transaction if address is unknown

        return this.knex('transactions').transacting(trx).forUpdate().select('*').where({
          'txid': transactionObj.txid,
          'address': transactionObj.address,
          'chain': chain
        }).then((transactions) => {
          if (transactions.length === 0)// create transaction
            return trx.insert(transactionObj).into('transactions').then(()=>{return trx.commit()})
          return trx.commit()
        })
      })

    })
  }

  addParsedBlock(chain, block) {
    return this.knex('blocks').select('*').where({'chain': chain, 'hash': block.hash}).then((blocks) => {
      if (blocks.length === 0) {
        let blockObj = _.defaults({'chain': chain}, block )
        return this.knex('blocks').insert(blockObj).then((result) => {
          if (result.rowCount === 1) return true
          else return Promise.reject(new Error("DB Error. Unable to add block."))
        })
      } else
        return undefined
    })
  }

  getUnprocessedBlocks(chain) {
    return this.knex('blocks').select('*').where('processedTime', null).orderBy('time', 'asc').map((row) => {
      return {
        'chain': row.chain,
        'hash': row.hash,
        'height': row.height,
        'time': row.time,
        'processedTime': row.processedTime
      }
    })
  }

  getLatestAddedBlock(chain, block) {
    return this.knex('blocks').select('*').orderBy('time', 'desc').limit(1).map((row) => {
      return {
        'chain': row.chain,
        'hash': row.hash,
        'height': row.height,
        'time': row.time,
        'processedTime': row.processedTime
      }
    })
  }

  getLatestProcessedBlock(chain, block) {
    return this.knex('blocks').select('*').where('processedTime', '<>', null).orderBy('processedTime').limit(1).map((row) => {
      return {
        'chain': row.chain,
        'hash': row.hash,
        'height': row.height,
        'time': row.time,
        'processedTime': row.processedTime
      }
    })
  }

  confirmBlock(chain, hash) {
    return this.knex('blocks').where('hash', hash).update({'processedTime': new Date()})
  }

  getBlock(chain, hash) {
    return this.knex('blocks').select('*').where({'chain': chain, 'hash': hash}).map((row) => {
      return {
        'chain': row.chain,
        'hash': row.hash,
        'height': row.height,
        'time': row.time,
        'processedTime': row.processedTime
      }
    }).then((blocks) => {
      if (blocks.length === 1)
        return blocks[0]
      else
        return undefined
    })
  }

  getAllUsedAddresses() {
    return this.knex('addresses').whereNot('account', '').map((row) => {
      return {
        'chain': row.chain,
        'account': row.accountName,
        'address': row.address
      }
    })
  }

  addAddresses(chain, addressesObjects) {
    let now = new Date()
    let inserts = _.map(addressesObjects, (addressObject) => {
      return {
        'chain': chain,
        'address': addressObject.address,
        'account': '',
        'index': addressObject.index,
        'importTime': now
      }
    })

    return this.knex('addresses').insert(inserts).returning('id')
  }
}

module.exports = DatabaseBroker
