#!/usr/bin/env node

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID KEYS GENERATED ===\n');
console.log('VAPID_PUBLIC_KEY:');
console.log(vapidKeys.publicKey);
console.log('\nVAPID_PRIVATE_KEY:');
console.log(vapidKeys.privateKey);
console.log('\nVAPID_EMAIL:');
console.log('admin@tunegocio.com (o tu email)\n');
console.log('Copia estos valores a tu dashboard de Vercel en Settings > Vars\n');
