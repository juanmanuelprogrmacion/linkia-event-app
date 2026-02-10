# 🤖 AI Context - LinkiaEvent

Este archivo sirve como punto de entrada y contexto condensado para que un LLM (como Cursor, Claude o GPT) entienda rápidamente el proyecto y pueda ayudar en el desarrollo.

## 🚀 Visión General
**LinkiaEvent** es una plataforma de networking premium para eventos que utiliza una interfaz de tipo swipe (estilo Tinder) para conectar asistentes. 
- **Enfoque**: Rapidez de acceso (sin login tradicional) y networking bidireccional de alto valor.
- **Tecnología**: Next.js 16 (App Router), Tailwind 4, Supabase (DB + Realtime + Edge Functions).

## 🛠 Arquitectura de Software
- **Frontend**: Rutas dinámicas basadas en `[slug]` (el identificador del evento).
- **Backend**: *Serverless*. No hay servidores Node.js. Toda la lógica reside en **Supabase Edge Functions**.
- **API Client**: Centralizado en `src/lib/api.ts`. Todas las llamadas externas deben pasar por aquí.

## 🛢 Estructura de Datos (Supabase)
Relaciones clave:
- `Events` -> Raíz de todo el contenido.
- `Sessions` -> Identificación por dispositivo (`device_hash`).
- `Profiles` -> Perfiles efímeros vinculados a un evento y una sesión.
- `Swipes` -> Acciones de 'connect' o 'skip'.
- `Matches` -> Creados cuando hay 'connect' mutuo.
- `Conversations/Messages` -> Chat en tiempo real via Realtime.

## 📂 Archivos de Referencia Cruciales
- `DEVELOPER_GUIDE.md`: Instrucciones de setup, endpoints de API y stack técnico.
- `ERD_DIAGRAM.md`: Diagrama de base de datos detallado (Mermaid).
- `PRD_REDUCED.md`: Objetivos de producto y flujo de usuario (MVP).
- `src/lib/api.ts`: Contrato de interfaz entre el frontend y el backend.

## 💡 Guías de Implementación para el LLM
1. **Rutas**: Para cualquier página nueva, agrégala bajo `src/app/e/[slug]/...` para mantener el contexto del evento.
2. **Estilos**: Sigue el diseño **Dark Premium**. Usa las variables de `globals.css`. Prioriza Framer Motion para transiciones.
3. **Datos**: Para fetch de datos, usa siempre el contexto de sesión (`session-context.tsx`) para obtener el token necesario para las Edge Functions.
4. **Mocking**: Si necesitas probar el flujo de entrada, usa los códigos de acceso: `TECH26`, `AIMAD`, `SWVAL`.

## 📌 Estado Actual del Repositorio
- Git no inicializado localmente (pendiente de `git init`).
- Servidor de desarrollo: `npm run dev` en puerto 3000.
- `.env.local`: Configurado con el proyecto de Supabase `gzzaocucnhkaexnfgmyq`.
