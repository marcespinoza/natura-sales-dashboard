# Guía del Sistema de Puntos de Lealtad

## Descripción General

El sistema de puntos de lealtad permite que los clientes acumulen puntos por cada compra que realizan. Los puntos pueden canjearse por descuentos y tienen una fecha de vencimiento configurable.

## Configuración del Sistema

### 1. Acceder a Configuración

1. Inicia sesión como administrador
2. Ve a **Configuración** en el menú de administración
3. Busca la sección **Configuración de Puntos de Recompensa**

### 2. Configurar Parámetros

#### Porcentaje de Puntos (%)
- Define cuántos puntos se otorgan por cada compra
- **Ejemplo**: Si configuras 10%, en una compra de $100 se otorgan 10 puntos
- Rango: 0 a 100%

#### Días de Expiración de Puntos
- Define cuántos días tienen validez los puntos antes de vencerse
- **Ejemplo**: Si configuras 365 días, los puntos vencen después de 1 año
- Rango: 1 a 3650 días (hasta 10 años)
- Los puntos vencidos se establecen automáticamente a 0 y se registran en el log de vencimientos

#### Habilitar Canje de Puntos
- Activa o desactiva la opción de que los clientes canjeen puntos
- Cuando está habilitado, los clientes verán un botón "Canjear Puntos" en su dashboard

## Cómo Funcionan los Puntos

### Ganancia de Puntos

1. **Compra Completa**: Los puntos se otorgan SOLO cuando se paga la compra en su totalidad
2. **Cálculo**: `Puntos = (Monto Total × Porcentaje) / 100`
3. **Ejemplo**: 
   - Compra: $500
   - Porcentaje: 10%
   - Puntos ganados: 50 puntos

### Vencimiento de Puntos

- Los puntos vencen automáticamente después de los días configurados
- Ejemplo: Si configuras 365 días y un cliente acumula puntos el 1 de enero, vencerán el 31 de diciembre del mismo año
- Al vencer, el saldo de puntos se establece a 0
- Se crea un registro en el log de vencimientos

### Canje de Puntos

- Los clientes pueden canjear puntos por descuentos en futuras compras (cuando esté habilitado)
- La cantidad de puntos a canjear se deduce del saldo disponible

## Gestión de Puntos por Cliente

### Ver Saldo de Puntos

1. Ve a **Clientes** en el panel de administración
2. Selecciona un cliente específico
3. Verás la tarjeta de información con **Puntos acumulados**

### Ajustar Puntos Manualmente

A veces es necesario ajustar los puntos de un cliente (por ejemplo, como compensación):

1. En la página del cliente, haz clic en **Ajustar Puntos**
2. Ingresa la cantidad a ajustar:
   - Números positivos: suma puntos (ej: +100)
   - Números negativos: resta puntos (ej: -50)
3. Opcionalmente, añade una razón (ej: "Compensación por error")
4. Haz clic en **Confirmar Ajuste**

**Ejemplo**:
- Cliente tiene: 150 puntos
- Ajuste: +50
- Resultado: 200 puntos

## Vista del Cliente

### Dashboard de Puntos

En **Mi Perfil → Puntos**, los clientes pueden ver:

- **Puntos Disponibles**: Saldo actual de puntos
- **Total Ganado**: Todos los puntos acumulados de por vida
- **Vencimiento**: Días hasta que vencen los puntos
- **Historial de Puntos**: Detalle de todas las transacciones de puntos

### Canje de Puntos

Si está habilitado, los clientes verán un banner con opción para canjear sus puntos.

## API para Expiración de Puntos

Existe un endpoint para ejecutar manualmente la expiración de puntos:

**POST** `/api/admin/points/expire-points`

Este endpoint:
- Busca todos los clientes con puntos vencidos
- Registra la expiración en el log
- Establece el saldo de puntos a 0
- Devuelve un resumen de puntos expirados

**Respuesta Exitosa**:
```json
{
  "message": "Points expiration completed successfully",
  "expired": 5,
  "total": 5
}
```

## Mejores Prácticas

1. **Verificar Configuración Regularmente**: Asegúrate de que el porcentaje y los días de vencimiento sean apropiados para tu negocio

2. **Comunicar a Clientes**: Informa a tus clientes sobre:
   - Cuántos puntos ganan por compra
   - Cuándo vencen sus puntos
   - Cómo pueden canjearlos

3. **Monitorear Vencimientos**: Revisa regularmente el log de vencimientos para ver cuántos puntos se expiran

4. **Usar Ajustes Responsablemente**: Utiliza la función de ajuste manual solo cuando sea necesario (errores, compensaciones, etc.)

## Solución de Problemas

### Los puntos no se suman después de una compra
- Verifica que la compra esté pagada en su totalidad
- Comprueba que el porcentaje de puntos esté configurado en un valor mayor a 0

### Los puntos no vencen
- Accede a la sección de configuración de puntos
- Verifica que haya un valor en "Días de Expiración"
- Ejecuta el endpoint de expiración manualmente si es necesario

### Un cliente tiene menos puntos de los esperados
- Revisa el historial de puntos del cliente
- Verifica si hubo ajustes manuales
- Comprueba si los puntos vencieron
