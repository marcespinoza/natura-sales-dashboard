# Sistema de Gestión de Clientes y Puntos de Lealtad

Un sistema completo de gestión de clientes con programa de puntos de lealtad, construido con Next.js, Supabase y Tailwind CSS.

## Características Principales

### 🎯 Gestión de Clientes
- Panel de administración para gestionar clientes
- Registro y perfil de clientes
- Historial completo de compras y pagos
- Cálculo automático de estadísticas

### ⭐ Sistema de Puntos de Lealtad
- Acumulación automática de puntos al completar pagos
- Configuración flexible del porcentaje de puntos
- Vencimiento automático de puntos con registro de historial
- Opción de canje de puntos (configurable)
- Ajuste manual de puntos para compensaciones

### 🛍️ Gestión de Compras y Pagos
- Registro de compras por cliente
- Seguimiento de pagos parciales y totales
- Validación de montos de pago
- Historial detallado de transacciones

### 📢 Notificaciones
- Sistema de notificaciones en tiempo real
- Campañas de comunicación masiva
- Notificaciones por correo electrónico

### 📊 Dashboard y Reportes
- Dashboard del cliente con estadísticas personales
- Dashboard de administración con resumen de ventas
- Historial de compras y puntos responsive

### 🔐 Autenticación y Seguridad
- Autenticación segura con Supabase
- Rol de administrador con gestión de permisos
- Datos cifrados y protegidos

### 📱 Diseño Responsive
- Interfaz adaptable a desktop y móvil
- Componentes optimizados para toda resolución

## Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS v4, Shadcn/UI
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Deployment**: Vercel

## Estructura del Proyecto

```
.
├── app/
│   ├── dashboard/           # Dashboard del cliente
│   │   ├── page.tsx        # Vista principal
│   │   ├── purchases/      # Historial de compras
│   │   ├── payments/       # Histórico de pagos
│   │   └── points/         # Gestión de puntos
│   ├── admin/              # Panel de administración
│   │   ├── page.tsx        # Dashboard admin
│   │   ├── clients/        # Gestión de clientes
│   │   ├── products/       # Gestión de productos
│   │   ├── notifications/  # Sistema de notificaciones
│   │   └── settings/       # Configuración del sistema
│   ├── api/                # Rutas API
│   │   └── admin/
│   │       └── points/
│   │           └── expire-points/ # Expiración de puntos
│   └── auth/               # Autenticación
├── components/
│   ├── ui/                 # Componentes Shadcn/UI
│   └── dashboard/          # Componentes específicos
├── lib/
│   ├── format.ts          # Funciones de formato
│   ├── types.ts           # Tipos TypeScript
│   └── supabase/          # Cliente de Supabase
├── scripts/
│   ├── add-settings-table.sql           # Tabla de configuración
│   ├── add-points-expiration.sql        # Tabla de expiración de puntos
│   └── [otras migraciones]
└── public/                 # Archivos estáticos
```

## Instalación y Setup

### Requisitos Previos
- Node.js 18+
- pnpm (o npm/yarn)
- Cuenta de Supabase

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/loyalty-system.git
cd loyalty-system
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 4. Ejecutar Migraciones de Base de Datos
```bash
# Ejecutar scripts SQL en Supabase para crear tablas
```

### 5. Ejecutar en Desarrollo
```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Para Clientes

1. **Crear Cuenta**: Regístrate en la plataforma
2. **Ver Dashboard**: Accede a tu perfil y dashboard personal
3. **Visualizar Compras**: Ve el historial de todas tus compras
4. **Consultar Puntos**: Revisa tus puntos acumulados y próxima expiración
5. **Canjear Puntos**: Si está habilitado, canjea puntos por descuentos

### Para Administradores

1. **Gestionar Clientes**: 
   - Crear, editar y ver detalles de clientes
   - Ajustar puntos manualmente
   
2. **Registrar Compras y Pagos**:
   - Crear nuevas compras
   - Registrar pagos parciales o totales
   - Eliminar compras si es necesario

3. **Configurar Sistema**:
   - Ajustar porcentaje de puntos
   - Configurar días de expiración
   - Habilitar/deshabilitar canje de puntos
   - Gestionar administradores

4. **Enviar Notificaciones**:
   - Crear campanãs de comunicación
   - Enviar notificaciones a clientes específicos o todos

5. **Ejecutar Expiración de Puntos**:
   - Ejecutar endpoint para vencer puntos automáticamente
   - Revisar historial de expiración

## Documentación Adicional

- [Guía de Setup con GitHub](./GITHUB_SETUP.md)
- [Guía Completa del Sistema de Puntos](./POINTS_SYSTEM_GUIDE.md)

## API Endpoints

### Puntos

- **POST** `/api/admin/points/expire-points` - Ejecutar expiración de puntos

## Configuración Recomendada

- **Porcentaje de Puntos**: 10% (1 punto por cada $10 gastados)
- **Días de Expiración**: 365 días (1 año)
- **Habilitar Canje**: Sí

## Mejoras Futuras

- [ ] Integración de pagos con Stripe
- [ ] Reportes analíticos avanzados
- [ ] APP móvil nativa
- [ ] Sistema de referidos
- [ ] Tipos de puntos (oro, plata, bronce)
- [ ] Recompensas por cumpleaños

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte, contacta al administrador del sistema o abre un issue en GitHub.

## Autores

Proyecto desarrollado con v0 AI por Vercel.

---

**Última actualización**: 2026-03-15
