import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
import joblib

# Create dummy data that matches our expected input features
# The data itself doesn't matter, only the structure.
dummy_data = {
    'age': [55, 60, 45],
    'gender': [1, 0, 1],
    'systolic_bp': [145, 130, 120],
    'is_smoker': [1, 0, 0],
    'has_diabetes': [0, 0, 1],
    'total_cholesterol': [250, 200, 210],
    'hdl_cholesterol': [40, 60, 50],
    'TenYearCHD': [1, 0, 1] # Target variable
}
df = pd.DataFrame(dummy_data)
X = df.drop('TenYearCHD', axis=1)
y = df['TenYearCHD']

# Create and "train" the model
model = GradientBoostingClassifier()
model.fit(X, y)

# Save the trained model to a file
# This is the file our service will load.
joblib.dump(model, 'ai_service/models/cardiovascular_risk_model.joblib')
print("Mock model created and saved to ai_service/models/cardiovascular_risk_model.joblib")