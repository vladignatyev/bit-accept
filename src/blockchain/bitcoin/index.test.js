let should = require('chai').should()
let expect = require('chai').expect
let nock = require('nock')

let Decimal = require('decimal.js')

let bitcoin = require('./index')


// Prepare nocks

nock('https://blockchain.info')
  .get(/rawblock\/(.+)$/)
  .reply(200, require('./requests/rawblock'))

nock('https://blockchain.info')
  .get(/latestblock$/)
  .reply(200, require('./requests/latestblock'))

nock('https://blockchain.info')
  .get(/blocks\/(.+)$/)
  .reply(200, require('./requests/blocks'))


describe('Blockchain.Bitcoin', () => {

  describe('APIManager', () => {
    it('should exist', () => {
      let a = new bitcoin.APIManager()
      a.should.exist
    })
    it('should request latest block', (done) => {
      let a = new bitcoin.APIManager()

      a.getLatestBlock().then((latestBlock) => {
        latestBlock.should.be.an.instanceOf(Object)
        latestBlock.should.have.all.keys('time', 'hash', 'height')

        latestBlock.time.should.be.an.instanceOf(Date)
        latestBlock.hash.should.be.a('string')
        latestBlock.height.should.be.a('number')
        done()
      })
    })
    it('should request blocks', (done) => {
      let a = new bitcoin.APIManager()
      a.getLatestBlocks(new Date()).then((blocks) => {
        blocks.should.be.an('array')
        blocks.should.have.lengthOf.above(0)
        blocks[0].should.have.all.keys('time', 'hash', 'height')
        blocks[10].should.have.all.keys('time', 'hash', 'height')
        done()
      })
    })
    it('should obtain deposits from block', (done) => {
      let a = new bitcoin.APIManager()
      a.getDepositsFromBlock('000000000000000000458f2e2522e2e08ac49068ed94108813e200559344b0db')
      .then((txs)=>{
        let correctDeposit
        let incorrectDeposit
        for(var i = 0; i < txs.length; i++)
          if (txs[i].addr === '1CwpToCxbLpoum5Sfs5tbhfCT6ru5Xpkg7') {
            correctDeposit = txs[i]
          } else if (txs[i].addr === '1Gsdf41ezQroubPPnxxv4sqDZpQYB5emsq') {
            incorrectDeposit = txs[i]
          }

        expect(incorrectDeposit).to.be.undefined

        correctDeposit.should.have.all.keys('addr', 'txhash', 'value')
        correctDeposit.txhash.should.equal('7f558dc9e017c58d22a92804ad84debbd4d6e87410343d64692b7aff3054c952')
        correctDeposit.value.toString().should.equal('0.12159055')

        done()
      })
    })
  })
})
