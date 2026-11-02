from pathlib import Path

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "tickets.csv"
MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(exist_ok=True)


# -----------------------------
# Load Dataset
# -----------------------------
df = pd.read_csv(DATA_PATH)

print("=" * 60)
print("Dataset")
print("=" * 60)
print(f"Rows: {len(df)}")
print("\nCategory distribution:")
print(df["category"].value_counts())

print("\nPriority distribution:")
print(df["priority"].value_counts())


# -----------------------------
# Helper: Create ML Pipeline
# -----------------------------
def create_model():
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    min_df=1,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )


# =========================================================
# CATEGORY MODEL
# =========================================================
print("\n" + "=" * 60)
print("Training Category Model")
print("=" * 60)

X_category_train, X_category_test, y_category_train, y_category_test = (
    train_test_split(
        df["text"],
        df["category"],
        test_size=0.2,
        random_state=42,
        stratify=df["category"],
    )
)

category_model = create_model()

category_model.fit(
    X_category_train,
    y_category_train,
)

category_predictions = category_model.predict(
    X_category_test
)

category_accuracy = accuracy_score(
    y_category_test,
    category_predictions,
)

print(f"\nCategory Accuracy: {category_accuracy:.2%}")

print(
    classification_report(
        y_category_test,
        category_predictions,
        zero_division=0,
    )
)

joblib.dump(
    category_model,
    MODEL_DIR / "category_model.joblib",
)

print("Saved: models/category_model.joblib")


# =========================================================
# PRIORITY MODEL
# =========================================================
print("\n" + "=" * 60)
print("Training Priority Model")
print("=" * 60)

X_priority_train, X_priority_test, y_priority_train, y_priority_test = (
    train_test_split(
        df["text"],
        df["priority"],
        test_size=0.2,
        random_state=42,
        stratify=df["priority"],
    )
)

priority_model = create_model()

priority_model.fit(
    X_priority_train,
    y_priority_train,
)

priority_predictions = priority_model.predict(
    X_priority_test
)

priority_accuracy = accuracy_score(
    y_priority_test,
    priority_predictions,
)

print(f"\nPriority Accuracy: {priority_accuracy:.2%}")

print(
    classification_report(
        y_priority_test,
        priority_predictions,
        zero_division=0,
    )
)

joblib.dump(
    priority_model,
    MODEL_DIR / "priority_model.joblib",
)

print("Saved: models/priority_model.joblib")


# =========================================================
# QUICK TEST
# =========================================================
print("\n" + "=" * 60)
print("Quick Prediction Test")
print("=" * 60)

test_messages = [
    "ต่อ Wi-Fi บริษัทไม่ได้",
    "คอมเปิดไม่ติดเลย",
    "ลืมรหัสผ่านเข้าอีเมล",
    "โปรแกรมบัญชีเปิดแล้วเด้ง",
]

for message in test_messages:
    category = category_model.predict(
        [message]
    )[0]

    category_confidence = max(
        category_model.predict_proba(
            [message]
        )[0]
    )

    priority = priority_model.predict(
        [message]
    )[0]

    priority_confidence = max(
        priority_model.predict_proba(
            [message]
        )[0]
    )

    print(f"\nข้อความ: {message}")
    print(
        f"Category: {category} "
        f"({category_confidence:.2%})"
    )
    print(
        f"Priority: {priority} "
        f"({priority_confidence:.2%})"
    )


print("\nTraining completed.")