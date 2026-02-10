# 🚀 LinkiaEvent - Guía para Desarrolladores

Bienvenido al proyecto **LinkiaEvent**. Esta es una plataforma de networking premium diseñada para eventos, donde los asistentes pueden conectar, hacer match y chatear basándose en sus intereses profesionales.

---

## 🛠 Teclogía (Stack)

- **Frontend**: [Next.js 16 (App Router)](https://nextjs.org/) con React 19.
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) & Vanilla CSS.
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/).
- **Backend / DB**: [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Edge Functions).
- **Lenguaje**: TypeScript.

---

## ⚙️ Configuración Local

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Variables de Entorno**: Crea un archivo `.env.local` en la raíz con el siguiente contenido (puedes pedirle las credenciales actuales al equipo):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://gzzaocucnhkaexnfgmyq.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=... (tu anon key)
    ```

3.  **Correr en local**:
    ```bash
    npm run dev
    ```
    La app estará disponible en `http://localhost:3000`.

---

## 📂 Estructura del Proyecto

- `src/app/`: Contiene las rutas y páginas (App Router).
  - `e/[slug]/`: Ruta principal del evento. Aquí ocurre la magia.
  - `e/[slug]/discover`: El "feed" de perfiles donde el usuario hace swipe.
  - `e/[slug]/matches`: Listado de personas con las que se ha hecho match.
  - `e/[slug]/chat/[id]`: Chat en tiempo real.
  - `e/[slug]/profile`: Gestión del perfil del asistente para SE evento específico.
- `src/components/`: Componentes reutilizables de la UI (Cards, Modals, Nav).
- `src/lib/`: Utilidades lógicas y cliente de API.
  - `api.ts`: Centraliza todas las llamadas a las **Supabase Edge Functions**.

---

## 🛢 Base de Datos (Supabase)

La lógica de negocio reside principalmente en Supabase. Tablas clave:
- `events`: Información general de los eventos.
- `profiles`: Perfiles de usuario (vinculados a una sesión).
- `swipes`: Registra los "connect" o "skip".
- `matches`: Creados automáticamente cuando dos perfiles se dan "connect" mutuamente.
- `conversations` & `messages`: Sistema de mensajería.
- `stands`: Expositores/Sponsors del evento.

### Códigos de Evento para QA:
Si necesitas probar el "check-in", usa estos códigos:
- `TECH26` -> Tech Summit Barcelona 2026
- `AIMAD`  -> AI Conference Madrid 2026
- `SWVAL`  -> Startup Weekend Valencia

---

## ⚡️ Supabase Edge Functions

Esta aplicación utiliza **Supabase Edge Functions** (escritas en Deno/TypeScript) como capa lógica de backend. Esto permite mantener la latencia baja y escalar automáticamente.

### Puntos Clave:
- **Ubicación de llamadas**: Centralizadas en `src/lib/api.ts`.
- **Invocación**: Se realizan vía HTTPS directamente al endpoint de Supabase (`/functions/v1/...`).
- **Authorization**: 
    - Algunas funciones son públicas (como `get-events` o `create-session`).
    - Las funciones protegidas requieren un **Bearer Token** en el header, el cual se obtiene al crear la sesión y se almacena en `localStorage` (gestionado automáticamente por el cliente de API).
- **CORS**: Las funciones están configuradas para aceptar peticiones desde el dominio de la app.

### Endpoints Principales:
| Función | Método | Descripción | Requiere Token |
| :--- | :--- | :--- | :---: |
| `create-session` | `POST` | Inicializa la sesión del usuario con un fingerprint del dispositivo. | ❌ |
| `get-events` | `GET` | Recupera la lista de eventos públicos disponibles. | ❌ |
| `validate-code` | `POST` | Valida el código de acceso a un evento específico. | ❌ |
| `upsert-profile` | `POST` | Crea o actualiza el perfil del asistente. | ✅ |
| `get-feed` | `GET` | Obtiene la lista de perfiles sugeridos para swipe. | ✅ |
| `submit-swipe` | `POST` | Registra un "connect" o "skip" y detecta matches. | ✅ |
| `get-matches` | `GET` | Lista los contactos confirmados (matches). | ✅ |
| `upload-photo` | `POST` | Gestiona la subida de imágenes a Supabase Storage. | ✅ |

### Desarrollo de Funciones:
Si necesitas modificar la lógica del backend, deberás usar la CLI de Supabase:
```bash
# Para servir funciones localmente (requiere Docker)
supabase functions serve --no-verify-jwt
```

---

## 🎨 Diseño y UX

- El diseño es **Premium Dark Mode**.
- Todas las interacciones de cartas deben ser fluidas (usa Framer Motion).
- No uses colores genéricos; utiliza las variables definidas en `globals.css` o tokens de Tailwind.

---

¡Buena suerte con el código! Si tienes dudas sobre las Edge Functions o la estructura de la base de datos, pregunta en el canal de desarrollo.
