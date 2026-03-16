# Conectar Proyecto a GitHub

Esta guía te ayudará a conectar tu proyecto con GitHub y compartirlo en línea.

## Pasos para conectar con GitHub

### 1. Crear un repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el icono `+` en la esquina superior derecha
3. Selecciona "New repository"
4. Completa los datos:
   - **Repository name**: `loyalty-system` (o el nombre que prefieras)
   - **Description**: "Sistema de gestión de clientes y puntos de lealtad"
   - **Visibility**: Elige "Private" (privado) o "Public" (público)
5. NO inicialices el repositorio con README, .gitignore o licencia
6. Haz clic en "Create repository"

### 2. En tu máquina local (en v0)

Una vez creado el repositorio en GitHub, verás instrucciones. Sigue estos comandos:

```bash
# Si aún no tienes git inicializado
git init

# Agregar todas los archivos
git add .

# Crear el primer commit
git commit -m "Inicial: Sistema de gestión de clientes y puntos de lealtad"

# Agregar el repositorio remoto (reemplaza USERNAME y REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Subir al repositorio
git branch -M main
git push -u origin main
```

### 3. Verificar en GitHub

- Ve a tu repositorio en GitHub
- Deberías ver todos los archivos del proyecto
- Ahora puedes hacer commits adicionales con:
  ```bash
  git add .
  git commit -m "Descripción del cambio"
  git push
  ```

## Estructura del Proyecto

```
loyalty-system/
├── app/                    # Rutas y páginas Next.js
│   ├── dashboard/         # Dashboard del cliente
│   ├── admin/            # Panel de administración
│   ├── api/              # Rutas API
│   └── auth/             # Autenticación
├── components/           # Componentes reutilizables
├── lib/                  # Utilidades y funciones
├── scripts/              # Scripts de migración y setup
├── public/               # Archivos estáticos
└── README.md            # Documentación
```

## Características Principales

- **Autenticación**: Sistema de login seguro con Supabase
- **Gestión de Clientes**: Panel admin para gestionar clientes
- **Sistema de Puntos**: Acumulación, expiración y canje de puntos
- **Historial de Compras**: Seguimiento completo de compras y pagos
- **Notificaciones**: Sistema de alertas para clientes
- **Responsive**: Funciona en desktop y móvil

## Variables de Entorno

Crea un archivo `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

## Más Información

Para más ayuda, consulta:
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [GitHub Docs](https://docs.github.com)
