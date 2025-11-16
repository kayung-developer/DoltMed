import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from .schemas import RiskPredictionInput, RiskPredictionOutput

# Global variable to hold the loaded model
ml_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the machine learning model during startup
    global ml_model
    try:
        ml_model = joblib.load("./models/cardiovascular_risk_model.joblib")
        print("ML model loaded successfully.")
    except FileNotFoundError:
        print("Error: Model file not found. Make sure you've run create_mock_model.py")
        ml_model = None
    yield
    # Clean up resources if needed during shutdown
    ml_model = None
    print("ML model unloaded.")


app = FastAPI(
    title="DortMed AI Inference Service",
    description="A dedicated microservice for hosting and serving ML models.",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"status": "AI Inference Service is running."}


@app.post("/predict/cardiovascular-risk", response_model=RiskPredictionOutput, tags=["Prediction"])
async def predict_risk(input_data: RiskPredictionInput):
    """
    Predicts the 10-year risk of a cardiovascular event.
    """
    if ml_model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Service is unavailable.")

    try:
        # 1. Convert Pydantic model to a pandas DataFrame
        # The model was trained on a DataFrame, so the input for prediction
        # must have the exact same structure, including column order.
        feature_names = ml_model.feature_names_in_
        input_df = pd.DataFrame([input_data.dict()], columns=feature_names)

        # 2. Make a prediction
        # model.predict_proba returns probabilities for each class [class_0, class_1]
        # We want the probability of the positive class (risk event).
        prediction_proba = ml_model.predict_proba(input_df)[0][1]

        # 3. Post-process the output
        risk_probability = float(prediction_proba)

        risk_level = "Low"
        if risk_probability > 0.15: risk_level = "Moderate"
        if risk_probability > 0.30: risk_level = "High"
        if risk_probability > 0.50: risk_level = "Very High"

        return RiskPredictionOutput(
            risk_probability=risk_probability,
            risk_level=risk_level
        )

    except Exception as e:
        # This will catch errors if the input data is malformed for the model
        raise HTTPException(status_code=400, detail=f"Error during prediction: {str(e)}")