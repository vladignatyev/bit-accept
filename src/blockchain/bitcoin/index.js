const Decimal = require('decimal.js')
const request = require('request-promise')


class APIManager {
  getLatestBlocks(datetime) {
    let time = (datetime === undefined ? Date.now() : datetime) / 1000 | 0 * 1000

    return request.get('https://blockchain.info/blocks/' + time + '?format=json').then((body) => {
      var responseObj = JSON.parse(body)
      var result = []
      for (var i = 0; i < responseObj.blocks.length; i++) {
        result.push({
          height: responseObj.blocks[i].height,
          time: new Date(responseObj.blocks[i].time * 1000),
          hash: responseObj.blocks[i].hash
        })
      }
      return result
    })
  }

  getLatestBlock() {
    return request.get('https://blockchain.info/latestblock').then((body) => {
      var responseObj = JSON.parse(body);

      return {
        height: responseObj.height,
        time: new Date(responseObj.time * 1000),
        hash: responseObj.hash
      }
    })
  }

  getDepositsFromBlock(blockHash) {
    return request.get('https://blockchain.info/rawblock/' + blockHash).then((body) => {
      var responseObj = JSON.parse(body);
      var txOutputs = [];
      for (var i = 0; i < responseObj.tx.length; i++) {
        var tx = responseObj.tx[i];
        for (var o = 0; o < tx.out.length; o++) {
          if (tx.out[o].spent) continue;
          if (tx.out[o].addr === undefined) continue;
          txOutputs.push({
            'txhash': tx.hash,
            'addr': tx.out[o].addr,
            'value': Decimal(tx.out[o].value).mul(Decimal(0.00000001)),
          })
        }
      }
      return txOutputs
    })
  }
}


module.exports.APIManager = APIManager
