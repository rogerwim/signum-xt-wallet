import { entropyToMnemonic } from "bip39";
import * as forge from "node-forge";
import scrypt from "scryptsy";

export interface AccountCredentials {
  sk: string | null;
  pk: string | null;
  pkh: string;
  seedPhrase: string;
}

async function decrypt(chipher: string, password: string, salt: string) {
  try {
    if (!password || !salt) {
      throw new Error("Missing password or salt");
    }
    const parts = chipher.split("==");
    const chiphertext = parts[0];
    const tag = parts[1];
    const key = await scrypt.async(
      password,
      Buffer.from(salt, "hex"),
      65536,
      8,
      1,
      32
    );
    const decipher = forge.cipher.createDecipher(
      "AES-GCM",
      key.toString("binary")
    );
    decipher.start({
      iv: Buffer.from(salt, "hex"),
      tag: forge.util.createBuffer(
        Buffer.from(tag, "hex").toString("binary"),
        "utf-8"
      ),
    });
    decipher.update(
      forge.util.createBuffer(
        Buffer.from(chiphertext, "hex").toString("binary"),
        "utf-8"
      )
    );
    const pass = decipher.finish();
    if (pass) {
      return Buffer.from(decipher.output.toHex(), "hex");
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}

function bumpIV(salt: string, bumps: number) {
  if (bumps > 255) {
    throw new Error("Invalid incremention");
  }
  const buf = Buffer.from(salt, "hex");
  buf[13] = (buf[13] + 1) % 256;

  return buf.toString("hex");
}

export async function decryptKukaiSeedPhrase(json: string, pwd: string) {
  const walletData = JSON.parse(json);
  if (
    walletData.version === 3 &&
    (walletData.walletType === 4 || walletData.walletType === 0)
  ) {
    const iv = bumpIV(walletData.iv, 1);
    const entropy = await decrypt(walletData.encryptedEntropy, pwd, iv);
    if (!entropy) {
      throw new Error(
        "Failed to decrypt entropy. Make sure the password is correct"
      );
    }

    return entropyToMnemonic(entropy);
  }
  if (walletData.version !== 3) {
    throw new Error("Only files of version 3 can be processed");
  }
  throw new Error("Cannot reveal seed phrase for this wallet type");
}