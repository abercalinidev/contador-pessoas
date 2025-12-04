# Contador de Pessoas com Câmera e YOLO

Este projeto é um aplicativo de contagem de pessoas em tempo real utilizando a câmera do dispositivo e o modelo YOLO para detecção de pessoas. O backend é feito com FastAPI e o frontend com React Native (Expo).

---

## 🔹 Estrutura do Projeto

contador-pessoas/
│
├─ App.js # Aplicativo React Native
├─ package.json # Dependências do frontend
├─ main.py # Servidor FastAPI
├─ venv/ # Ambiente virtual Python (opcional)
└─ ...


---

## 🔹 Backend (FastAPI + YOLO)

### 1. Criar ambiente virtual (opcional, recomendado):

```bash
python -m venv venv

venv\Scripts\activate


pip install fastapi uvicorn python-multipart pillow
pip install ultralytics

crie um arquivo chamado main.py com esse codigo.

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
    # 1. Decodifica Base64 → bytes
    img_bytes = base64.b64decode(data.image)

    # 2. Converte bytes → imagem PIL
    img = Image.open(io.BytesIO(img_bytes))
    width, height = img.size

    # 3. Roda YOLO na imagem
    results = model(img)

    person_count = 0
    boxes = []

    # 4. Processa as detecções
    for box in results[0].boxes:
        if int(box.cls) == 0:  # classe 0 = pessoa
            person_count += 1

            # Extrai coordenadas da caixa
            x1, y1, x2, y2 = box.xyxy[0].tolist()  # xyxy é [x1, y1, x2, y2]
            boxes.append([x1, y1, x2, y2])

    # 5. Retorna contagem + coordenadas das caixas
    return {
        "people": person_count,
        "boxes": boxes
    }



uvicorn main:app --reload --host 0.0.0.0 --port 8000 -- rodar o servidor





dependencias do projeto...

npm install axios
npx expo install expo-camera expo-status-bar

