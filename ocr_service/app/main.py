import pytesseract
import re
import io
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI(
    title="DortMed OCR Service",
    description="Extracts structured data from lab result images.",
    version="1.0.0"
)


# --- OCR Processing and Parsing Logic ---

def preprocess_image(image_bytes: bytes) -> Image:
    """Converts image to grayscale and enhances contrast for better OCR."""
    image = Image.open(io.BytesIO(image_bytes))
    # Convert to grayscale
    image = image.convert('L')
    # In a real system, you might add more advanced preprocessing like
    # binarization, noise reduction, or deskewing here.
    return image


def extract_structured_data(text: str) -> dict:
    """
    Uses regular expressions and keyword matching to find common lab results.
    This is a rule-based approach and would be expanded for more lab types.
    """
    extracted = {}

    # Define patterns for common analytes.
    # Pattern: (analyte_name) followed by (value) and optional (units)
    # This is highly customizable for different lab report formats.
    patterns = {
        'total_cholesterol': r"total cholesterol\s*:?\s*(\d{1,3})\s*(mg/dL)?",
        'hdl': r"hdl cholesterol\s*:?\s*(\d{1,3})\s*(mg/dL)?",
        'ldl': r"ldl cholesterol\s*:?\s*(\d{1,3})\s*(mg/dL)?",
        'triglycerides': r"triglycerides\s*:?\s*(\d{1,3})\s*(mg/dL)?",
        'hemoglobin_a1c': r"hemoglobin a1c\s*:?\s*(\d\.?\d{1,2})\s*%",
        'glucose': r"glucose\s*:?\s*(\d{1,3})\s*(mg/dL)?",
        'wbc_count': r"wbc count\s*:?\s*(\d{1,2}\.?\d?)\s*(x10/L)?",
    }

    # Convert text to lowercase for case-insensitive matching
    text_lower = text.lower()

    for key, pattern in patterns.items():
        match = re.search(pattern, text_lower)
        if match:
            # The first capturing group is the value
            value = match.group(1)
            # Add to our structured dictionary
            extracted[key] = float(value)

    return extracted


@app.post("/ocr/process-lab-result")
async def process_lab_result(file: UploadFile = File(...)):
    """
    Receives a lab result image, performs OCR, and returns extracted structured data.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    image_bytes = await file.read()

    try:
        # 1. Preprocess the image for better accuracy
        processed_image = preprocess_image(image_bytes)

        # 2. Perform OCR using Tesseract
        # The `config` parameter can be used to improve accuracy, e.g., by specifying language or page segmentation mode.
        extracted_text = pytesseract.image_to_string(processed_image)

        # 3. Parse the raw text to find structured data
        structured_data = extract_structured_data(extracted_text)

        return {
            "raw_text": extracted_text,
            "structured_data": structured_data,
            "filename": file.filename
        }
    except Exception as e:
        # This could be a Tesseract error or a PIL error
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")