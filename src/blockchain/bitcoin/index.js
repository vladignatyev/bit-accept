const debug = require('debug')('bitaccept:Bitcoin')
const Decimal = require('decimal.js')
const request = require('request-promise')
const blocktrail = require('blocktrail-sdk')


class APIManager {
  constructor(apiKey, apiSecret, testnet) {
    this.client = blocktrail.BlocktrailSDK({apiKey: apiKey, apiSecret: apiSecret, network: "BTC", 'testnet': testnet});
  }

  getLatestBlocks(sinceDateTime) {
    let client = this.client

    debug(`Requesting new blocks since ${sinceDateTime}`)

    let makeRequest = (since, page, blocks) => {
      return new Promise(function(resolve, reject) {
        let _blocks = blocks
        let _since = since

        let cb = (err, response) => {
          if (err) {
            console.error('Error has occured: ', err);
            reject(err)
            return
          }

          for (var i = 0; i < response.data.length; i++) {
            let blockData = response.data[i]
            let block = {
              time: new Date(blockData.block_time),
              hash: blockData.hash,
              height: blockData.height
            }

            if (block.time > _since) {
              _blocks.push(block)
            } else {
              resolve({'abort': true})
              return
            }
          }

          setTimeout(() => {
            resolve({page: response.current_page, perPage: response.per_page, total: response.total})
          }, 500)

        }

        if (page) client.allBlocks({sort_dir: 'desc', 'page': page, 'limit': 100}, cb)
        else client.allBlocks({sort_dir: 'desc', 'page': 1, 'limit': 100}, cb)
      });
    }

    return new Promise(function(resolve, reject) {
      let blocks = []
      let iterateOrResolve = (result) => {
        let currentPage = result.page
        let perPage = result.perPage
        let total = result.total

        if (currentPage * perPage < total && !result.abort) {
          return makeRequest(sinceDateTime, currentPage + 1, blocks).then(iterateOrResolve).catch(reject)
        } else {
          resolve(blocks)
        }
      }
      return makeRequest(sinceDateTime, undefined, blocks).then(iterateOrResolve).catch(reject)
    });
  }

  getDepositsFromBlock(blockHash) {
    let client = this.client
    let makeRequest = (blockHash, page, txOutputs) => {
      return new Promise(function(resolve, reject) {
        let _outputs = txOutputs

        let cb = (err, blockTxs) => {
          if (err) {
            reject(err)
            return
          }

          for (var i = 0; i < blockTxs.data.length; i++) {
            let tx = blockTxs.data[i]
            for (var o = 0; o < tx.outputs.length; o++) {
              let output = tx.outputs[o]
              if (output.spent_hash !== null) continue;
              _outputs.push({
                'txhash': tx.hash,
                'address': output.address,
                'value': output.value // in satoshis
              })
            }
          }
          setTimeout(() => {resolve({page: blockTxs.current_page, perPage: blockTxs.per_page, total:blockTxs.total})}, 1000)
        }

        if (page) client.blockTransactions(blockHash, {'page': page, 'limit': 100}, cb)
        else client.blockTransactions(blockHash, {'page': 1, 'limit': 100}, cb)
      })
    }

    return new Promise(function(resolve, reject) {
      let txOutputs = []
      let iterateOrResolve = (result) => {
        let currentPage = result.page
        let perPage = result.perPage
        let total = result.total

        if (currentPage * perPage < total) {
          return makeRequest(blockHash, currentPage + 1, txOutputs).then(iterateOrResolve)
        } else {
          resolve(txOutputs)
        }
      }
      makeRequest(blockHash, undefined, txOutputs).then(iterateOrResolve).catch(reject)
    });
  }
}





module.exports.APIManager = APIManager
