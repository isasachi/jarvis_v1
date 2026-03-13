import os
import httpx


class LLMService:
    def __init__(self):
        self.webhook_url = os.environ.get("JARVIS_WEBHOOK_URL", "")
        self.api_key = os.environ.get("JARVIS_API_KEY", "")
        self.session_id = "jarvis-session"

    async def query(self, text: str) -> str:
        if not self.webhook_url or not self.webhook_url.startswith("http"):
            return "Error: JARVIS_WEBHOOK_URL not configured. Please set the environment variable."
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.webhook_url,
                headers={
                    "x-api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "query": text,
                    "sessionId": self.session_id
                }
            )

            print(f"n8n status: {response.status_code}")
            print(f"n8n response: {response.text}")
            
            if not response.text.strip():
                return "Error: n8n devolvió respuesta vacía"

            if response.status_code != 200:
                return f"Error: {response.status_code} - {response.text}"

            data = response.json()
            return data.get("output") or data.get("response") or str(data)
