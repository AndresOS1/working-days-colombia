# Working Days Colombia

API REST en **TypeScript** que calcula fechas hábiles en Colombia (`America/Bogota`) considerando festivos, horario laboral y conversión a UTC.

---

## 📦 Requisitos
- Node.js 18+ / npm 9+
- Git

---

## ⚙️ Instalación
```bash
git clone https://github.com/AndresOS1/working-days-colombia.git
cd working-days-colombia
npm install

# Ambiente de desarrollo con recarga automática
npm run dev

# Compilar a JavaScript
npm run build

# Ejecutar en producción (requiere build previo)
npm start
```

---

## 🏗️ Estructura del Proyecto

```
src/
├── app.ts                # Configuración de Express
├── server.ts             # Punto de entrada del servidor
├── routes.ts             # Definición de rutas
├── controllers/          # Controladores de endpoints
│   ├── healthController.ts
│   └── workingDateController.ts
├── engine/               # Lógica de negocio
│   ├── businessTime.ts   # Motor de cálculo de fechas hábiles
│   ├── holidays.ts       # Proveedor de festivos
│   └── types.ts          # Tipos TypeScript
└── utils/                # Utilidades
    └── http.ts           # Helpers para respuestas HTTP
```

---

## 🚏 Endpoints Disponibles

### GET `/`
Devuelve un mensaje de prueba (**Hello World**).

**📤 Respuesta:**
```json
{ "message": "Hello World" }
```

---

### GET `/health`
Health check del servidor.

**📤 Respuesta:**
```json
{ "status": "ok" }
```

---

### GET `/working-date`
Calcula la **fecha hábil** sumando días y/o horas laborales.

#### 🔑 Parámetros de query

| Parámetro | Tipo    | Requerido | Descripción |
|-----------|---------|-----------|-------------|
| `days`    | integer | opcional  | Número entero positivo de **días hábiles** a sumar. |
| `hours`   | integer | opcional  | Número entero positivo de **horas hábiles** a sumar. |
| `date`    | string  | opcional  | Fecha inicial en **UTC** (`ISO8601` con `Z`). |

⚠️ **Debes enviar al menos uno de los parámetros `days` o `hours`.**

#### ✅ Ejemplo de éxito
```bash
curl "http://localhost:3000/working-date?days=5&hours=4&date=2025-04-10T15:00:00.000Z"
```

**📤 Respuesta:**
```json
{ "date": "2025-04-21T20:00:00Z" }
```

#### ❌ Ejemplo de error
```bash
curl "http://localhost:3000/working-date"
```

**📤 Respuesta:**
```json
{ "error": "InvalidParameters", "message": "at least one of 'days' or 'hours' must be provided" }
```

#### 🔧 Otros ejemplos de uso

**Solo días hábiles:**
```bash
curl "http://localhost:3000/working-date?days=3"
```

**Solo horas hábiles:**
```bash
curl "http://localhost:3000/working-date?hours=8"
```

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga automática |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Ejecuta el servidor en producción (requiere build previo) |
| `npm run lint` | Ejecuta el linter de código |
| `npm run lint:fix` | Ejecuta el linter y corrige errores automáticamente |

---

## 🔧 Tecnologías Utilizadas

- **TypeScript** - Lenguaje de programación
- **Express.js** - Framework web
- **Luxon** - Manejo de fechas y zonas horarias
- **Zod** - Validación de esquemas
- **Undici** - Cliente HTTP para obtener festivos
- **ESLint** - Linter de código

---

## 📝 Notas Importantes

- El servidor se ejecuta por defecto en el puerto **3000**
- Las fechas se manejan en zona horaria **America/Bogota**
- Los festivos se obtienen de una fuente externa
- El horario laboral se considera de lunes a viernes, 8:00 AM a 5:00 PM
- Todas las fechas de respuesta están en formato UTC (ISO 8601 con 'Z')
