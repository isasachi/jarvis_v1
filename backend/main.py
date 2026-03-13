import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from contextlib import asynccontextmanager

from services.tts_service import TTSService
from services.llm_service import LLMService
from services.sentence_splitter import split_sentences

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Se ejecuta antes de recibir cualquier petición
    await tts_service.initialize()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tts_service = TTSService()
llm_service = LLMService()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            user_text = message.get("text", "")

            if not user_text:
                continue

            response_text = await llm_service.query(user_text)

            sentences = split_sentences(response_text)

            for sentence in sentences:
                if not sentence.strip():
                    continue

                await websocket.send_text(json.dumps({
                    "type": "sentence_start",
                    "text": sentence
                }))

                audio_bytes = await tts_service.synthesize(sentence)
                await websocket.send_bytes(audio_bytes)

                await websocket.send_text(json.dumps({"type": "sentence_end"}))

            await websocket.send_text(json.dumps({"type": "response_complete"}))

    except WebSocketDisconnect:
        pass


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
