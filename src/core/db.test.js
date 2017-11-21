let should = require('chai').should()
let expect = require('chai').expect
let knex = require('../db/knex')
let Decimal = require('decimal.js')
let utils = require('./utils')

let DatabaseBroker = require('./db')

let cleanDb = () => {
  let queries = [
    knex('blocks').delete(),
    knex('addresses').delete(),
    knex('transactions').delete()
  ]
  return Promise.all(queries)
}

beforeEach(cleanDb)
afterEach(cleanDb)

describe('DatabaseBroker', () => {
  describe('#getUnprocessedBlocks', () => {
    it('should return unprocessed block', (done) => {
      db = new DatabaseBroker()

      db.addParsedBlock('bitcoin', {
        'hash': '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae',
        'height': 493185,
        'time': new Date(1509885585 * 1000),
        'processedTime': new Date()
      }).then(() => {
        return db.addParsedBlock('bitcoin', {
          'hash': '00000000000000fake1911629ebefadd68584f955060287dcd18909b25d850ae',
          'height': 493185,
          'time': new Date(1509885585 * 1000)
        })
      }).then(() => {
        return db.getUnprocessedBlocks()
      }).then((blocks) => {
        blocks.should.be.an('array').that.have.lengthOf(1)
        blocks[0].hash.should.equal('00000000000000fake1911629ebefadd68584f955060287dcd18909b25d850ae')
      }).then(done)
    })
  })

  describe('#confirmBlock', () => {
    it('should make block as processed timestamping it', (done) => {
      db = new DatabaseBroker()

      db.addParsedBlock('bitcoin', {
        'hash': '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae',
        'height': 493185,
        'time': new Date(1509885585 * 1000),
        'processedTime': null
      }).then(() => {
        return db.confirmBlock('bitcoin', '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae')
      }).then(() => {
        return knex('blocks').where('hash', '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae').then((objs) => {
          objs.should.be.an('array').that.have.lengthOf(1)
          objs[0].processedTime.should.be.not.null
        })
      }).then(done)
    })

    it('should not be possible to get confirmed block as unprocessed', (done) => {
      db = new DatabaseBroker()

      db.addParsedBlock('bitcoin', {
        'hash': '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae',
        'height': 493185,
        'time': new Date(1509885585 * 1000),
        'processedTime': null
      }).then(() => {
        return db.confirmBlock('bitcoin', '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae')
      }).then(() => {
        return db.getUnprocessedBlocks()
      }).then((blocks) => {
        blocks.should.be.an('array').that.have.lengthOf(0)
        // blocks[0].hash.should.equal('00000000000000fake1911629ebefadd68584f955060287dcd18909b25d850ae')
      }).then(done)
    })
  })

  describe('#addParsedBlock', () => {
    it('should add parsed block', (done) => {
      db = new DatabaseBroker()
      db.addParsedBlock('bitcoin', {
        'hash': '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae',
        'height': 493185,
        'time': new Date(1509885585 * 1000),
        'processedTime': new Date(),
      }).then((result) => {
        result.should.be.true
        done()
      })
    })

    it('should throw because the block has already been added', (done) => {
      db = new DatabaseBroker()
      var block = {
        'hash': '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae',
        'height': 493185,
        'time': new Date(1509885585 * 1000),
        'processedTime': new Date(),
      }
      db.addParsedBlock('bitcoin', block).then((result) => {
        return db.addParsedBlock('bitcoin', block)
      }).then((_result) => {
        (typeof _result).should.equal('undefined')
        done()
      })
    })
  })

  describe('#getAddressesForAccount', () => {
    it('should return addresses', (done) => {
      db = new DatabaseBroker()

      db.addAddresses('bitcoin', [{'index':1, 'address':	'1addressForAccount1'}]).then(() => {
        return db.addAddresses('ethereum', [{'index':1, 'address':	'0xfakeaddress'}])
      }).then(() => {
        return db.addAddresses('myownchain', [{'index':1, 'address':	'testaddress'}])
      }).then(() => {
        return db.getOrChooseAddressForAccount('bitcoin', 'account1')
      }).then(() => {
        return db.getOrChooseAddressForAccount('ethereum', 'account1')
      }).then(() => {
        return db.getOrChooseAddressForAccount('myownchain', 'account1')
      }).then(() => {
        db.getAddressesForAccount('account1').then((addresses)=>{
          addresses.should.be.an('array').that.have.lengthOf(3)
          done()
        })
      })
    })
  })

  describe('#getAllTransactionsByAccount', () => {
    it('should return transactions for specified account', (done) => {
      db = new DatabaseBroker()

      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'1addressForAccount1'},
        {'index':12, 'address':	'1addressForAccount2'},
        {'index':13, 'address':	'1addressForAccount3'}
      ]).then((ids) => {
        return db.getOrChooseAddressForAccount('bitcoin', 'account1').then(() => {
          return db.getOrChooseAddressForAccount('bitcoin', 'account2')
        }).then(()=> {
          return db.getOrChooseAddressForAccount('bitcoin', 'account3')
        })
      }).then(() => {
        return Promise.all([
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1addressForAccount1',
            'txid': 'txid1',
            'confirmed': true,
            'value': utils.toSatoshi('0.10000000'),
            'payload': '',
            'importTime': new Date()
          }),
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1addressForAccount2',
            'txid': 'txid1',
            'confirmed': true,
            'value': utils.toSatoshi('0.20000000'),
            'payload': '',
            'importTime': new Date()
          }),
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1addressForAccount3',
            'txid': 'txid2',
            'confirmed': true,
            'value': utils.toSatoshi('0.30000000'),
            'payload': '',
            'importTime': new Date()
          }),
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1addressForAccount3',
            'txid': 'txid3',
            'confirmed': true,
            'value': utils.toSatoshi('0.04000000'),
            'payload': '',
            'importTime': new Date()
          }),
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1addressForAccount3',
            'txid': 'txid4',
            'confirmed': true,
            'value': utils.toSatoshi('0.00500000'),
            'payload': '',
            'importTime': new Date()
          })
        ])
      }).then(() =>{
        return db.getAllTransactionsByAccount('account1').then((transactions)=>{
          transactions.should.be.an('array').that.have.lengthOf(1)
          utils.fromSatoshi(transactions[0].value).should.equal('0.1')
        })
      }).then(() =>{
        return db.getAllTransactionsByAccount('account2').then((transactions)=>{
          transactions.should.be.an('array').that.have.lengthOf(1)
          utils.fromSatoshi(transactions[0].value).should.equal('0.2')
        })
      }).then(() =>{
        return db.getAllTransactionsByAccount('account3').then((transactions)=>{
          transactions.should.be.an('array').that.have.lengthOf(3)
          utils.fromSatoshi(transactions[0].value).should.equal('0.3')
          utils.fromSatoshi(transactions[1].value).should.equal('0.04')
          utils.fromSatoshi(transactions[2].value).should.equal('0.005')
        })
      }).then(done)
    })
  })

  describe('#confirmTransaction', () => {
    it('should mark transaction as confirmed', (done) => {
      db = new DatabaseBroker()

      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'2Faked8jKVUnE1tQgBzfXY2BMW84UN59yV'}
      ]).then((ids) => {
        return db.createTransaction('bitcoin', {
          'chain': 'bitcoin',
          'address': '2Faked8jKVUnE1tQgBzfXY2BMW84UN59yV',
          'txid': 'faketxid1',
          'confirmed': false,
          'value': utils.toSatoshi('1.23456789'),
          'payload': '',
          'importTime': new Date()
        })
      }).then((o) => {
        return db.confirmTransaction('bitcoin', 'faketxid1', '2Faked8jKVUnE1tQgBzfXY2BMW84UN59yV')
      }).then((o) => {
        return knex('transactions').where({'txid': 'faketxid1', 'address':'2Faked8jKVUnE1tQgBzfXY2BMW84UN59yV', 'chain': 'bitcoin'}).then((o)=> {
          o.should.be.an('array').that.have.lengthOf(1)
          o[0].confirmed.should.be.true
        })
      }).then(done)

    })
  })

  describe('#createTransaction', () => {
    it('should create transactions', () => {
      db = new DatabaseBroker()

      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'1Faked8jKVUnE1tQgBzfXY2BMW84UN59yV'},
        {'index':12, 'address':	'1FakeVT6znD4tLt67iERjg6uGFLMNgDMAQ'},
        {'index':13, 'address':	'1FakeVT7znD4tLt67iERjg6uGFLMNgDMAQ'},
        {'index':14, 'address':	'1FakeVT8znD4tLt67iERjg6uGFLMNgDMAQ'},
        {'index':15, 'address':	'1FakeVT9znD4tLt67iERjg6uGFLMNgDMAQ'},
        {'index':16, 'address':	'1FakeVT0znD4tLt67iERjg6uGFLMNgDMAQ'},
        {'index':17, 'address':	'1FakeVT6znD3tLt67iERjg6uGFLMNgDMAQ'},
        {'index':18, 'address':	'1FakeVT6znD5tLt67iERjg6uGFLMNgDMAQ'}
      ]).then((ids) => {
        return Promise.all([
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1Faked8jKVUnE1tQgBzfXY2BMW84UN59yV',
            'txid': 'faketxid1',
            'confirmed': false,
            'value': utils.toSatoshi('1.23456789'),
            'payload': '',
            'importTime': new Date()
          }),
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1Faked8jKVUnE1tQgBzfXY2BMW84UN59yV',
            'txid': 'faketxid2',
            'confirmed': false,
            'value': utils.toSatoshi('0.23450000'),
            'payload': '',
            'importTime': new Date()
          }),
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '1FakeVT6znD5tLt67iERjg6uGFLMNgDMAQ',
            'txid': 'faketxid3',
            'confirmed': false,
            'value': utils.toSatoshi('0.11110000'),
            'payload': '',
            'importTime': new Date()
          }),
        ])
      })
    })

    it('should not create transactions for non existing addresses', () => {
      db = new DatabaseBroker()
      db.createTransaction('bitcoin', {
        'chain': 'bitcoin',
        'address': '1FakedNONEXISTINGBzfXY2BMW84UN59yV',
        'txid': 'faketxid1',
        'confirmed': false,
        'value': utils.toSatoshi('1.23456789'),
        'payload': '',
        'importTime': new Date()
      }).then((result) => {
        expect(result).to.be.undefined
      })
    })

    it('should not create transaction twice', (done) => {
      db = new DatabaseBroker()

      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'2Faked8jKVUnE1tQgBzfXY2BMW84UN59yV'}
      ]).then((ids) => {
        return Promise.all([
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '2Faked8jKVUnE1tQgBzfXY2BMW84UN59yV',
            'txid': 'faketxid1',
            'confirmed': false,
            'value': utils.toSatoshi('1.23456789'),
            'payload': '',
            'importTime': new Date()
          }),
          db.createTransaction('bitcoin', {
            'chain': 'bitcoin',
            'address': '2Faked8jKVUnE1tQgBzfXY2BMW84UN59yV',
            'txid': 'faketxid1',
            'confirmed': false,
            'value': utils.toSatoshi('1.23456789'),
            'payload': '',
            'importTime': new Date()
          }),
        ])
      }).then((o) => {
        knex('transactions').select('*').then((txs) => {
          txs.should.be.an('array').that.have.lengthOf(1)
          done()
        })
      })
    })
  })

  describe('#getBlock', () => {
    it('should return added block', (done) => {
      let block = {
        'chain': 'bitcoin',
        'hash': '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae',
        'height': 493185,
        'time': new Date(1509885585 * 1000),
        'processedTime': new Date(),
      }
      knex('blocks').insert(block).then(()=>{
        db = new DatabaseBroker()
        return db.getBlock('bitcoin', '0000000000000000001911629ebefadd68584f955060287dcd18909b25d850ae')
      }).then((block) => {
        block.should.be.an('object').that.have.all.keys({
          'hash': true,
          'height': true,
          'time': true,
          'processedTime': true,
          'chain': true
        })

        done()
      })

    })
  })

  describe('#addAddresses', () => {

    it('should add addresses', () => { // smoke
      db = new DatabaseBroker()

      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'1Lmd7d8jKVUnE1tQgBzfXY2BMW84UN59yV'},
        {'index':12, 'address':	'17krbVT6znD4tLt67iERjg6uGFLMNgDMAQ'}
      ]).then((ids) => {
        ids.should.be.an('array')
        ids.should.have.lengthOf(2)
      })
    })
  })

  describe('#getAllUsedAddresses', () => {


    it('should return no addresses', () => {
      let db = new DatabaseBroker()
      db.getAllUsedAddresses().then((addresses) => {
        addresses.should.be.lengthOf(0)
      })
    })

    it('should return no addreses because all addresses are not used yet', () => {
      let db = new DatabaseBroker()
      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'1Lmd7d8jKVUnE1tQgBzfXY2BMW84UN59yV'},
        {'index':12, 'address':	'17krbVT6znD4tLt67iERjg6uGFLMNgDMAQ'}
      ]).then(() => {
        return db.getAllUsedAddresses()
      }).then((addresses) => {
        addresses.should.be.lengthOf(0)
      })
    })

    it('should return one addreses', (done) => {
      let db = new DatabaseBroker()
      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'1Lmd7d8jKVUnE1tQgBzfXY2BMW84UN59yV'},
        {'index':12, 'address':	'17krbVT6znD4tLt67iERjg6uGFLMNgDMAQ'}
      ]).then(() => {
        return db.getOrChooseAddressForAccount('bitcoin', 'testAccount1')
      }).then(() => {
        return db.getAllUsedAddresses()
      }).then((addresses) => {
        addresses.should.be.lengthOf(1)
        addresses[0].should.be.an('object').that.have.all.keys({'chain': true, 'address': true, 'account': true})
      })
      .then(done)
    })
  })

  describe('#getOrChooseAddressForAccount', () => {
    it('should link new account with new address', (done) => {
      let db = new DatabaseBroker()
      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'1Lmd7d8jKVUnE1tQgBzfXY2BMW84UN59yV'},
        {'index':12, 'address':	'17krbVT6znD4tLt67iERjg6uGFLMNgDMAQ'}
      ]).then(() => {
        db.getOrChooseAddressForAccount('bitcoin', 'testAccount1').then((address) => {
          address.should.equal('1Lmd7d8jKVUnE1tQgBzfXY2BMW84UN59yV')
          done()
        })
      })
    })

    it('should returned linked address for account added', (done) => {
      let db = new DatabaseBroker()
      db.addAddresses('bitcoin', [
        {'index':11, 'address':	'1Lmd7d8jKVUnE1tQgBzfXY2BMW84UN59yV'},
        {'index':12, 'address':	'17krbVT6znD4tLt67iERjg6uGFLMNgDMAQ'},
        {'index':17, 'address':	'146Hyzk9H551SMvGMpoAYaMDSEpEcqwrEP'}
      ]).then((added) => {
        return Promise.all([db.getOrChooseAddressForAccount('bitcoin', 'testAccount1'), db.getOrChooseAddressForAccount('bitcoin', 'testAccount2'), ])
      })
      .then(()=>{
        return db.getOrChooseAddressForAccount('bitcoin', 'testAccount3')
      }).then((address) => {
        return db.getOrChooseAddressForAccount('bitcoin', 'testAccount3')
      })
      .then((address) => {
        address.should.equal('146Hyzk9H551SMvGMpoAYaMDSEpEcqwrEP')
        done()
      })
      .catch((err) => {
        console.log(err);
        done()
        fail()
      })
    }, 15000)
  })

})
