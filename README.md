criar um arquivo no mesmo nivel que o projeto com o nome main.py

com exatamente esse codigo

from fastapi import FastAPI
from pydantic import BaseModel
import base64
from PIL import Image
import io
from ultralytics import YOLO

# Carrega modelo YOLO (primeira vez ele baixa)
model = YOLO("yolov8n.pt")

app = FastAPI()

class Frame(BaseModel):
    image: str  # imagem em Base64

@app.post("/process")
async def process_frame(data: Frame):
    # 1. Decodifica Base64 ? bytes
    img_bytes = base64.b64decode(data.image)

    # 2. Converte bytes ? imagem PIL
    img = Image.open(io.BytesIO(img_bytes))

    # 3. Roda YOLO na imagem
    results = model(img)

    # 4. Conta quantas pessoas foram detectadas
    person_count = 0
    for box in results[0].boxes:
        if int(box.cls) == 0:  # classe 0 = pessoa
            person_count += 1

    # 5. Retorna resposta para o app
    return {
        "people": person_count
    }

entrar no mesmo ambiente que esta seu projeto e executar....

{{ python -m venv venv }} cria uma pasta necessaria para criar um servidor python.
{{ venv\Scripts\activate }} entrar no cmd dentro do servidor
{{ pip install fastapi uvicorn python-multipart pillow }} instala as depencencias necessarias
{{ pip install ultralytics }} mais dependencias

{{ uvicorn main:app --reload --host 0.0.0.0 --port 8000 }} sobre o servidor.

testa usar http://localhost:8000/docs


