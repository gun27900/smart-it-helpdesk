from pathlib import Path

import joblib
from fastapi import FastAPI
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

category_model = joblib.load(
    MODEL_DIR / "category_model.joblib"
)

priority_model = joblib.load(
    MODEL_DIR / "priority_model.joblib"
)

app = FastAPI(
    title="Smart IT Helpdesk AI",
    version="1.0.0",
)


class PredictRequest(BaseModel):
    title: str
    description: str = ""


def predict_priority(text: str):
    text_lower = text.lower()

    # -----------------------
    # CRITICAL
    # -----------------------
    critical_keywords = [
        "ทั้งบริษัท",
        "ทั้งสำนักงาน",
        "ทุกแผนก",
        "ทั้งชั้น",
        "ล่มทั้งหมด",
        "server หลัก",
        "เซิร์ฟเวอร์หลัก",
        "admin หลัก",
        "ใช้งานไม่ได้ทุก",
    ]

    if any(
        keyword in text_lower
        for keyword in critical_keywords
    ):
        return "CRITICAL", "rule", 1.0

    # -----------------------
    # HIGH
    # -----------------------
    high_keywords = [
        "เปิดไม่ติด",
        "เข้าใช้งานไม่ได้",
        "เข้าไม่ได้",
        "ถูกล็อก",
        "ถูกระงับ",
        "vpn",
        "server",
        "เซิร์ฟเวอร์",
        "สูญหาย",
        "ฮาร์ดดิสก์",
        "hard disk",
    ]

    if any(
        keyword in text_lower
        for keyword in high_keywords
    ):
        return "HIGH", "rule", 0.9

    # -----------------------
    # LOW
    # -----------------------
    low_keywords = [
        "ขอคำแนะนำ",
        "ต้องการติดตั้ง",
        "ต้องการเปลี่ยนรหัสผ่าน",
        "reset password",
        "ย้ายโต๊ะ",
        "เตรียมอุปกรณ์",
    ]

    if any(
        keyword in text_lower
        for keyword in low_keywords
    ):
        return "LOW", "rule", 0.9

    # -----------------------
    # ML fallback
    # -----------------------
    prediction = priority_model.predict(
        [text]
    )[0]

    probabilities = (
        priority_model.predict_proba(
            [text]
        )[0]
    )

    confidence = float(
        max(probabilities)
    )

    # ถ้า ML ไม่มั่นใจ ให้ใช้ MEDIUM
    if confidence < 0.50:
        return "MEDIUM", "fallback", confidence

    return (
        prediction,
        "ml",
        confidence,
    )


@app.get("/")
def root():
    return {
        "service": "Smart IT Helpdesk AI",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.post("/predict")
def predict(data: PredictRequest):
    text = (
        f"{data.title} "
        f"{data.description}"
    ).strip()

    # Category ML
    category = category_model.predict(
        [text]
    )[0]

    category_probabilities = (
        category_model.predict_proba(
            [text]
        )[0]
    )

    category_confidence = float(
        max(category_probabilities)
    )

    # Priority Hybrid
    (
        priority,
        priority_source,
        priority_confidence,
    ) = predict_priority(text)

    return {
        "category": category,
        "categoryConfidence": round(
            category_confidence,
            4,
        ),
        "priority": priority,
        "priorityConfidence": round(
            priority_confidence,
            4,
        ),
        "prioritySource": priority_source,
        "needsReview":
            category_confidence < 0.50,
    }