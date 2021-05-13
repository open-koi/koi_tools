// https://github.com/acolytec3/arweave-mnemonic-keys

//@ts-ignore Allow implicit any here
import { generateKeyPair, getKeyPairFromMnemonic } from "human-crypto-keys";
import * as crypto from "libp2p-crypto";

/**
 * Generate a 12 word mnemonic for an Arweave key
 * @returns {string} - a promise resolving to a 12 word mnemonic seed phrase
 */
export async function generateMnemonic(): Promise<string> {
  const keys = await generateKeyPair(
    { id: "rsa", modulusLength: 4096 },
    { privateKeyFormat: "pkcs1-pem" }
  );
  return keys.mnemonic;
}

/**
 * Generates a JWK object representation of an Arweave key
 * @param mnemonic - a 12 word mnemonic represented as a string
 * @returns {object} - returns a Javascript object that conforms to the JWKInterface required by Arweave-js
 */
export async function getKeyFromMnemonic(mnemonic: string): Promise<any> {
  const keyPair = await getKeyPairFromMnemonic(
    mnemonic,
    { id: "rsa", modulusLength: 4096 },
    { privateKeyFormat: "pkcs1-pem" }
  );

  //@ts-ignore Need to access private attribute
  const privateKey = (await crypto.keys.import(keyPair.privateKey, ""))._key;
  delete privateKey.alg;
  delete privateKey.key_ops;
  return privateKey;
}
