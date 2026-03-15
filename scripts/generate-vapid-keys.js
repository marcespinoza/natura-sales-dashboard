#!/usr/bin/env node

import crypto from 'crypto';

// Generate VAPID keys using native crypto
function generateVAPIDKeys() {
  // Generate a random 32-byte value for the public key
  const publicKeyBytes = crypto.randomBytes(65);
  publicKeyBytes[0] = 0x04; // Uncompressed point format
  
  // Generate a random 32-byte private key
  const privateKeyBytes = crypto.randomBytes(32);
  
  // Encode as base64url (RFC 4648 without padding)
  const publicKey = publicKeyBytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const privateKey = privateKeyBytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { publicKey, privateKey };
}

const { publicKey, privateKey } = generateVAPIDKeys();

console.log('\n=== VAPID KEYS GENERATED ===\n');
console.log('VAPID_PUBLIC_KEY:');
console.log(publicKey);
console.log('\nVAPID_PRIVATE_KEY:');
console.log(privateKey);
console.log('\nVAPID_EMAIL:');
console.log('admin@tunegocio.com');
console.log('\n=== Copia estos valores a Vercel Settings > Environment Variables ===\n');
