let should = require('chai').should()
let expect = require('chai').expect

let utils = require('./utils')
let Decimal = require('decimal.js')


describe('utils', () => {
  describe('toSatoshi', () => {
    it('should exist', () => {
      utils.toSatoshi.should.exist
    })

    it('should convert to satoshi', () =>{
      utils.toSatoshi('0.000000001').toString().should.equal('0')
      utils.toSatoshi('0.00000001').toString().should.equal('1')
      utils.toSatoshi('0.0000001').toString().should.equal('10')
      utils.toSatoshi('0.000001').toString().should.equal('100')
      utils.toSatoshi('0.00001').toString().should.equal('1000')
      utils.toSatoshi('0.0001').toString().should.equal('10000')
      utils.toSatoshi('0.001').toString().should.equal('100000')
      utils.toSatoshi('0.01').toString().should.equal('1000000')
      utils.toSatoshi('0.1').toString().should.equal('10000000')
      utils.toSatoshi('1.0').toString().should.equal('100000000')
      utils.toSatoshi('12.0').toString().should.equal('1200000000')
      utils.toSatoshi('123.0').toString().should.equal('12300000000')
      utils.toSatoshi('1234.0').toString().should.equal('123400000000')
      utils.toSatoshi('12345.0').toString().should.equal('1234500000000')
      parseInt(utils.toSatoshi('12345.0').toString()).should.equal(1234500000000)
      utils.toSatoshi('12345.67891234').toString().should.equal('1234567891234')
      parseInt(utils.toSatoshi('12345.67891234').toString()).should.equal(1234567891234)
      utils.toSatoshi(Decimal('12345.67891234')).toString().should.equal('1234567891234')
      parseInt(utils.toSatoshi(Decimal('12345.67891234')).toString()).toString().should.equal('1234567891234')
    })
  })

  describe('fromSatoshi', () => {
    it('should exist', () => {
      utils.fromSatoshi.should.exist
    })

    it('should convert from satoshi to proper BTC value', () => {
      utils.fromSatoshi('1200000000').should.equal('12')
      utils.fromSatoshi('120000000').should.equal('1.2')
      utils.fromSatoshi('12000000').should.equal('0.12')
    })
  })
})
