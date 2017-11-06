let Decimal = require('decimal.js')


function toSatoshi(decimal) {
  return (Decimal(decimal).div(Decimal('0.00000001')).round()).toString()
}

function fromSatoshi(decimal) {
  return Decimal(decimal).mul(Decimal('0.00000001')).toString()
}

module.exports = {
  'toSatoshi': toSatoshi,
  'fromSatoshi': fromSatoshi
}
