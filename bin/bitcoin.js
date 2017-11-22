let DatabaseBroker = require('../src/core/db')
let Bitcoin = require('../src/blockchain/bitcoin/index').APIManager
// let BlockParser = require('../src/core/blockparser')
let blocks = require('../src/core/blockparser')

let api = new Bitcoin('d67ad0e8576cce219c6e0b49a05f72d1b5a5b1ea', '44fc8514e042ead94875a51c125379d3a22500a1', false)
let db = new DatabaseBroker()
// let bp = new BlockParser(db, api, 'bitcoin', new Date(new Date - 24 * 3600 * 1000))

let bl = new blocks.BlockLoader('bitcoin', db, api, new Date(new Date - 30 * 24 * 3600 * 1000))
let bp = new blocks.BlockParser('bitcoin', db, api)


bp.processBlocks()
//
//
// bl.loadBlocks().then(()=>{
//   bp.processBlocks()
// }).catch((err) => {console.error(err);})
