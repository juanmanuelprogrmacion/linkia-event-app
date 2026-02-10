# 📄 PRD Reducido - LinkiaEvent

## 🎯 Objetivo del Producto
Facilitar el networking de alto valor en eventos profesionales mediante una interfaz ágil (tipo swipe) que permita a los asistentes conectar de forma bidireccional y chatear en tiempo real.

---

## 👥 Usuarios Objetivo
Asistentes a congresos, cumbres tecnológicas y meetups que buscan optimizar su tiempo y encontrar conexiones relevantes (empleo, inversión, partners).

---

## 💎 Propuesta de Valor
- **Fricción Cero**: Acceso rápido vía códigos de evento, sin procesos de registro pesados.
- **Contexto**: Perfiles optimizados específicamente para el evento actual.
- **Networking Activo**: Gamificación de las conexiones mediante el sistema de swipe.

---

## 🛠 Funcionalidades Core (MVP)

### 1. Sistema de Acceso (Check-in)
- Login mediante código de acceso único por evento (ej: `TECH26`).
- Identificación por dispositivo (sesiones persistentes sin contraseña).

### 2. Perfiles de Asistente
- Creación de perfil rápido: Foto, nombre, titular (headline) y bio.
- Perfiles vinculados al evento: Un usuario puede tener diferentes perfiles para diferentes eventos.

### 3. Networking (Discover)
- Feed de asistentes en formato tarjeta.
- Acciones: **Connect** (interés) o **Skip** (pasar).
- Algoritmo básico de feed: Mostrar personas que el usuario aún no ha visto.

### 4. Matches y Conexiones
- Sistema de "Double Opt-in": La conexión solo se activa si ambos se dan "Connect".
- Alerta visual de match inmediato.

### 5. Chat en Tiempo Real
- Hilo de conversación privado entre matches.
- Soporte para mensajes de texto básicos (vía Supabase Realtime).

---

## 🗺 Roadmap Próximas Fases
- **Stands Interactivos**: Listado de sponsors donde los usuarios pueden dejar su contacto (Lead Gen).
- **Push Notifications**: Alertas de nuevos matches o mensajes recibidos.
- **AI Matchmaking**: Sugerencias de descubrimiento basadas en la compatibilidad de perfiles.

---

## 🎨 Principios de Diseño
- **Mobile First**: Optimizado para ser usado en el móvil durante el evento.
- **Dark Premium**: Estética elegante y moderna (tonos oscuros con acentos azules/vibrantes).
- **Interacciones fluidas**: Feedback inmediato en cada swipe.
