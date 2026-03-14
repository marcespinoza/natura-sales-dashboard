import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Términos de Servicio - Natura',
  description: 'Términos y condiciones de uso de la plataforma Natura',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8">Términos y Condiciones de Servicio</h1>
          
          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
              <p className="mb-4">
                Al acceder y utilizar la plataforma Natura, aceptas completamente estos Términos y Condiciones de Servicio. Si no estás de acuerdo con alguna parte, por favor no uses nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Uso de la Plataforma</h2>
              <p className="mb-4">Te comprometes a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usar la plataforma solo con fines legales</li>
                <li>No interferir con la seguridad o funcionamiento de la plataforma</li>
                <li>No realizar actividades ilícitas o fraudulentas</li>
                <li>Proporcionar información precisa y veraz</li>
                <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Cuentas de Usuario</h2>
              <p className="mb-4">
                Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Te comprometes a aceptar responsabilidad por todas las actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente de cualquier acceso no autorizado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Transacciones y Pagos</h2>
              <p className="mb-4">
                Al realizar una transacción en nuestra plataforma, aceptas pagar el precio total indicado. Nos reservamos el derecho de rechazar o cancelar cualquier pedido. Todos los precios están sujetos a cambios sin previo aviso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Historial de Transacciones</h2>
              <p className="mb-4">
                Mantenemos un registro histórico de todas tus transacciones, compras y pagos. Puedes acceder a esta información en cualquier momento a través de tu cuenta de usuario.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Puntos de Lealtad</h2>
              <p className="mb-4">
                Los puntos de lealtad son acumulados según tus compras y no tienen valor monetario fuera de la plataforma. Los puntos pueden expirar según los términos especificados en el programa de lealtad. Nos reservamos el derecho de modificar el programa de puntos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Notificaciones</h2>
              <p className="mb-4">
                Al crear una cuenta, aceptas recibir notificaciones sobre tu cuenta, transacciones y promociones. Puedes controlar estas preferencias en la configuración de tu cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contenido de Usuario</h2>
              <p className="mb-4">
                Cualquier contenido que proporcionas (como información de perfil) debe ser legal y no violar derechos de terceros. Nos reservamos el derecho de eliminar contenido que viole estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitación de Responsabilidad</h2>
              <p className="mb-4">
                La plataforma se proporciona "tal cual" sin garantías de ningún tipo. No seremos responsables por daños indirectos, incidentales, especiales o consecuentes resultantes del uso o la imposibilidad de usar la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Cancelación y Terminación</h2>
              <p className="mb-4">
                Podemos suspender o terminar tu cuenta en cualquier momento por violación de estos términos. Puedes solicitar la eliminación de tu cuenta en cualquier momento contactando con soporte.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Modificaciones</h2>
              <p className="mb-4">
                Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios entrarán en vigor inmediatamente. Tu uso continuado de la plataforma constituye aceptación de los términos modificados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Ley Aplicable</h2>
              <p className="mb-4">
                Estos Términos están regidos por las leyes aplicables en tu jurisdicción. Cualquier disputa será resuelta en los tribunales competentes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contacto</h2>
              <p>
                Para preguntas sobre estos Términos, contacta con: <strong>legal@natura.com</strong>
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
