from fastapi import FastAPI, HTTPException
from typing import List
import spacy
from transformers import pipeline
import os

app = FastAPI()

# Load models at startup
nlp = None
classifier = None

@app.on_event("startup")
async def startup_event():
    global nlp, classifier
    try:
        nlp = spacy.load("en_core_web_lg")
        classifier = pipeline("zero-shot-classification",
                           model="facebook/bart-large-mnli")
    except Exception as e:
        raise RuntimeError(f"Failed to load models: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/generate-tags")
async def generate_tags(text: str, candidate_labels: List[str]):
    try:
        # First extract entities with Spacy
        doc = nlp(text)
        entities = [ent.text for ent in doc.ents]
        
        # Then classify with GLiClass
        result = classifier(text, candidate_labels)
        scores = {label: score for label, score in zip(
            result['labels'], result['scores'])}
        
        return {
            "entities": entities,
            "classification": scores
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))