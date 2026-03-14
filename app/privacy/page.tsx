import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Política de Privacidad - Natura',
  description: 'Política de privacidad de la plataforma Natura',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
          
          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
              <p className="mb-4">
                En Natura, nos comprometemos a proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y salvaguardamos tu información cuando utilizas nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Información que Recopilamos</h2>
              <p className="mb-4">Recopilamos información que nos proporcionas directamente, incluyendo:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nombre completo</li>
                <li>Correo electrónico</li>
                <li>Teléfono</li>
                <li>Dirección</li>
                <li>Información de transacciones y compras</li>
                <li>Datos de identificación cuando inicias sesión con proveedores externos (Google, Facebook)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Cómo Usamos tu Información</h2>
              <p className="mb-4">Utilizamos la información recopilada para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Gestionar tu cuenta y acceso a la plataforma</li>
                <li>Procesar y registrar compras y transacciones</li>
                <li>Enviar notificaciones relacionadas con tu cuenta</li>
                <li>Mejorar nuestros servicios</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Prevenir fraude y actividades ilícitas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Seguridad de los Datos</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet es 100% seguro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Compartir Información</h2>
              <p className="mb-4">
                No vendemos, intercambiamos ni transferimos tu información personal a terceros sin tu consentimiento, excepto:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>A nuestros proveedores de servicios que respaldan nuestra plataforma</li>
                <li>Cuando sea requerido por ley</li>
                <li>Para proteger nuestros derechos legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Tus Derechos</h2>
              <p className="mb-4">Tienes derecho a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acceder a tu información personal</li>
                <li>Solicitar la corrección de datos incorrectos</li>
                <li>Solicitar la eliminación de tu cuenta</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
              <p>
                Utilizamos cookies para mejorar tu experiencia en nuestra plataforma. Puedes controlar las cookies a través de la configuración de tu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cambios a esta Política</h2>
              <p>
                Nos reservamos el derecho de modificar esta política en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en esta página.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contacto</h2>
              <p>
                Si tienes preguntas sobre esta Política de Privacidad o nuestras prácticas de privacidad, por favor contacta con nosotros en: <strong>soporte@natura.com</strong>
              </p>
            </section>

            <section className="text-sm text-muted-foreground pt-8 border-t">
              <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}
