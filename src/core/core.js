let typeforce = require('typeforce');

let bitcoin = require('bitcoinjs-lib');
let crypto = require('crypto');
let ecdsa = require('bitcoinjs-lib/src/ecdsa.js');

let bip39 = require('bip39');

/**
 * Check sign up signature.
 * All values should pass simple checks and preformatting
 */
function getSignupHash(pubkeyString, timestampInt, serverNonceInt, signatureString) {
  // TODO: add typecheck

  if (timestamp < 1508888328101 || timestamp > Date.now())
    return undefined; // sanity check: Improperly timestamped

  let message = pubkeyString + '|' + timestampInt.toString();
  if (serverNonce) message = message + '|' + serverNonceInt.toString();

  const hasher = crypto.createHash('sha256');
  const hash = hasher.update(message).digest();

  return hash;
}

/**
 * Checks signature of hash among pubkeyString
 */
function checkSig(pubkeyString, hash, signatureString) {
  const userPubkeyPair = bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(pubkeyString, 'hex'));
  const parsedSignature = bitcoin.ECSignature.fromDER(new Buffer(signatureString, 'hex'));

  return ecdsa.verify(new Buffer(hash, 'hex'), parsedSignature, userPubkeyPair.Q);
}


function sign(keypairWifString, hashString) {
  const keypair = bitcoin.ECPair.fromWIF(keypairWifString);

  return ecdsa.sign(new Buffer(hashString, 'hex'), keypair.d).toDER().toString('hex');
}

function* bulkGenerateAddresses(count, startIndex, mnemonic) {
  if (startIndex === undefined || startIndex < 1) startIndex = 1;

  const strength = 256;
  const _mnemonic = mnemonic || bip39.generateMnemonic(strength);
  const seed = bip39.mnemonicToSeed(_mnemonic);
  const root = bitcoin.HDNode.fromSeedBuffer(seed);

  for (let i=0; i < count; i++) {
    var index = startIndex + i;
    // var derived = root.derivePath("m/0'/0/" + index.toString());
    var derived = root.derivePath("m/44'/0'/0'/0/" + index.toString())
    yield {'mnemonic': _mnemonic, 'address': derived.getAddress(), 'index': index.toString(), 'privkey': derived.keyPair.toWIF()};
  }
}

function genNewIdentity() {
  const mnemonic = bip39.generateMnemonic(256);
  const seed = bip39.mnemonicToSeed(mnemonic);
  const root = bitcoin.HDNode.fromSeedBuffer(seed);
  const keyPair = root.derivePath("m/0'/0/0").keyPair;

  return {
    'public': {
      'address': keyPair.getAddress(),
      'pubkey': keyPair.getPublicKeyBuffer().toString('hex')
    },
    'private': {
      'wif': keyPair.toWIF(),
      'mnemonic': mnemonic
    }
  };
}

module.exports = {
  'bulkGenerateAddresses': bulkGenerateAddresses,
  'sign': sign,
  'checkSig': checkSig,
  'genNewIdentity': genNewIdentity
}
