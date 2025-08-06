from fastapi import FastAPI, HTTPException
from typing import Optional
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import os

app = FastAPI()

# Model and tokenizer
model = None
tokenizer = None

@app.on_event("startup")
async def startup_event():
    global model, tokenizer
    try:
        model_name = "llama-3.1-storm-8B"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/summarize")
async def summarize_text(text: str, max_length: Optional[int] = 150):
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True)
        summary_ids = model.generate(
            inputs.input_ids,
            max_length=max_length,
            num_beams=4,
            early_stopping=True
        )
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))