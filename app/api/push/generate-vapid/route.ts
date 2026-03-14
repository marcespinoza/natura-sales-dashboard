import webpush from 'web-push'
import { NextResponse } from 'next/server'

export async function GET() {
  // IMPORTANTE: Solo usar esto en desarrollo
  // En producción, genera las claves localmente y úsalas como variables de entorno

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta ruta solo está disponible en desarrollo' },
      { status: 403 }
    )
  }

  const vapidKeys = webpush.generateVAPIDKeys()

  return NextResponse.json({
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
    instructions: 'Copia estas claves a tus variables de entorno como VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY',
  })
}
