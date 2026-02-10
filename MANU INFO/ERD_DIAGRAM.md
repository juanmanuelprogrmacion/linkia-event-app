# 📊 Diagrama ERD - LinkiaEvent

Este diagrama describe la estructura de la base de datos en Supabase y las relaciones entre las entidades principales del sistema.

```mermaid
erDiagram
    EVENTS ||--o{ SESSIONS : "contiene"
    EVENTS ||--o{ PROFILES : "tiene"
    EVENTS ||--o{ SWIPES : "registra"
    EVENTS ||--o{ MATCHES : "genera"
    EVENTS ||--o{ STANDS : "aloja"

    SESSIONS ||--|| PROFILES : "vinculada a"
    
    PROFILES ||--o{ SWIPES : "realiza (swiper)"
    PROFILES ||--o{ SWIPES : "recibe (swiped)"
    
    PROFILES ||--o{ MATCHES : "pertenece (profile_a)"
    PROFILES ||--o{ MATCHES : "pertenece (profile_b)"

    MATCHES ||--|| CONVERSATIONS : "crea"
    
    CONVERSATIONS ||--o{ MESSAGES : "contiene"

    STANDS ||--o{ STAND_LEADS : "genera"
    PROFILES ||--o{ STAND_LEADS : "se interesa en"

    EVENTS {
        uuid id PK
        text slug "unique"
        text name
        text access_code "unique"
        timestamp starts_at
        timestamp ends_at
        boolean is_active
    }

    SESSIONS {
        uuid id PK
        uuid event_id FK
        text device_hash
        text token "unique"
    }

    PROFILES {
        uuid id PK
        uuid session_id FK
        uuid event_id FK
        text display_name
        text headline
        text photo_url
        boolean is_complete
    }

    SWIPES {
        uuid id PK
        uuid event_id FK
        uuid swiper_id FK
        uuid swiped_id FK
        text action "'connect' | 'skip'"
    }

    MATCHES {
        uuid id PK
        uuid event_id FK
        uuid profile_a_id FK
        uuid profile_b_id FK
    }

    CONVERSATIONS {
        uuid id PK
        uuid event_id FK
        uuid match_id FK
        uuid user_a FK
        uuid user_b FK
    }

    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_user_id FK
        text body
        timestamp created_at
    }

    STANDS {
        uuid id PK
        uuid event_id FK
        text company_name
        text tier "'gold' | 'silver' | 'standard'"
    }
```

---

## 🔑 Conceptos Clave de la DB

1.  **Event Centric**: Casi todas las tablas están particionadas lógicamente por `event_id`. Esto permite que un mismo usuario (o dispositivo) tenga experiencias y perfiles totalmente aislados entre diferentes eventos.
2.  **Sesiones vs Auth**: No usamos el sistema de Auth tradicional de Supabase basado en email/password por defecto. Usamos una tabla de `sessions` vinculada a un `device_hash` para permitir un acceso instantáneo sin fricción.
3.  **Matches**: Un `match` es la unión de dos perfiles que se han dado "connect" mutuamente. Al crearse un match, el sistema dispara automáticamente la creación de una `conversation`.
4.  **Stands y Leads**: Los expositores (`stands`) pueden recolectar información de los perfiles que demuestran interés a través de la tabla `stand_leads`.
