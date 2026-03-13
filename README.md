# JARVIS - Nueva Arquitectura

Migración de LiveKit + DeepSeek a FastAPI + WebSockets + Piper TTS + n8n.

## Arquitectura

```
Browser (Chrome)
  ├── Web Speech API        → STT nativo del navegador
  ├── WebSocket client      → comunicación bidireccional
  ├── Three.js Arc Reactor  → HUD holográfico
  └── Web Audio API         → análisis de frecuencia

        ↕ WebSocket

FastAPI Backend (Railway)
  ├── /ws WebSocket endpoint
  ├── LLM Service           → n8n webhook
  ├── TTS Service           → Piper TTS
  └── Sentence Streamer     → streaming por oraciones

        ↕ HTTP POST

n8n (Railway)
  └── JARVIS Main + 6 sub-agentes
```

## Diferencias con la arquitectura anterior

| Componente | Anterior | Actual |
|------------|----------|--------|
| STT | DeepSeek (API) | Web Speech API (nativo) |
| Voz | LiveKit agents | Piper TTS |
| Backend | LiveKit agents | FastAPI + WebSockets |
| Orquestación | LiveKit rooms | n8n webhooks |
| GPU | Requerida | No requerida |

## Setup Local

### Prerrequisitos
- Docker y Docker Compose
- Chrome (para Web Speech API)

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
JARVIS_WEBHOOK_URL=https://tu-n8n-webhook-url
JARVIS_API_KEY=tu-api-key
```

### Ejecutar

```bash
docker-compose up --build
```

Accede al frontend en: http://localhost:8080

## Setup Railway

### 1. Backend

1. Crea un nuevo proyecto en Railway
2. Agrega un servicio desde GitHub (este repositorio)
3. Configura las variables de entorno:
   - `JARVIS_WEBHOOK_URL`: URL del webhook de n8n
   - `JARVIS_API_KEY`: tu API key
   - `TTS_QUALITY`: `medium` (CPU) o `high` (GPU)
4. Despliega

### 2. Frontend

1. Agrega otro servicio en Railway
2. Configura la variable de entorno:
   - `BACKEND_WS_URL`: `wss://tu-backend-url/ws`
3. Despliega

## Calidad de Voz

### Medium (default, Railway CPU)
```env
TTS_QUALITY=medium
```
Modelo más pequeño, inferencia rápida en CPU.

### High (servidores con GPU)
```env
TTS_QUALITY=high
```
Modelo de mayor calidad, requiere GPU.

## Desarrollo

### Estructura de archivos

```
jarvis/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── services/
│   │   ├── tts_service.py  # Piper TTS
│   │   ├── llm_service.py  # n8n webhook
│   │   └── sentence_splitter.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── index.html           # UI completa
│   ├── js/
│   │   ├── reactor.js       # Three.js Arc Reactor
│   │   ├── speech.js        # Web Speech API
│   │   └── socket.js        # WebSocket client
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Desarrollo sin Docker

```bash
# Backend
cd backend
cp .env.example .env
# Edita .env con tus credenciales
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
# Simplemente sirve los archivos estáticos
cd frontend
python -m http.server 8080
```

## Notas

- **Web Speech API**: Solo funciona en Chrome/Edge. Otros navegadores mostrarán una advertencia.
- **AudioContext**: Requiere interacción del usuario. El AudioContext se crea al primer click en el reactor.
- **n8n**: No requiere cambios. El backend envía el mismo formato `{ query, sessionId }` con header `x-api-key`.
- **Cold start**: El modelo TTS se descarga en build time para evitar cold starts largos en Railway.
