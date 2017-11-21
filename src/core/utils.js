let Decimal = require('decimal.js')
let _ = require('lodash')


function toSatoshi(decimal) {
  return (Decimal(decimal).div(Decimal('0.00000001')).round()).toString()
}

function fromSatoshi(decimal) {
  return Decimal(decimal).mul(Decimal('0.00000001')).toString()
}

let promiseSequence = (arrayOfPromises, delay) => {
  return Promise.all(_.map(arrayOfPromises, (promise, index) => {
    let timeout = index * delay
    let _promise = promise
    return new Promise(function(resolve, reject) {
      setTimeout(() => {
        _promise.then(resolve).catch(reject)
      }, timeout)
    });
  }))
}


module.exports = {
  'toSatoshi': toSatoshi,
  'fromSatoshi': fromSatoshi,
  'promiseSequence': promiseSequence
}
