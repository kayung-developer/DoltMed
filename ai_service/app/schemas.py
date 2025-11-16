from pydantic import BaseModel, Field


class RiskPredictionInput(BaseModel):
    age: int = Field(..., gt=0, example=55)
    gender: int = Field(..., description="0 for female, 1 for male", example=1)
    systolic_bp: int = Field(..., example=145)
    is_smoker: int = Field(..., description="0 for no, 1 for yes", example=1)
    has_diabetes: int = Field(..., description="0 for no, 1 for yes", example=0)
    total_cholesterol: int = Field(..., example=250)
    hdl_cholesterol: int = Field(..., example=40)

    # In a real model, you'd likely have more features
    # e.g., is_on_bp_meds, glucose_level, etc.


class RiskPredictionOutput(BaseModel):
    disease: str = "10-Year Cardiovascular Event"
    risk_probability: float = Field(..., description="The model's predicted probability of the event (0.0 to 1.0)")
    risk_level: str = Field(..., description="A categorical risk level (e.g., 'Low', 'Moderate', 'High')")