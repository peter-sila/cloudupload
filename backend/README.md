# Backend - FastAPI Upload Service

## Setup Instructions

### 1. Prerequisites
- Python 3.8 or higher
- MySQL Server running locally or remotely
- Cloudinary account (for testing) or Cloudflare R2 access

### 2. Virtual Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Database Setup

```bash
# Log into MySQL
mysql -u root -p

# Run the database setup script
source database.sql

# Or copy and paste the contents of database.sql into MySQL client
```

### 5. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials. This project now uses Cloudinary for file storage.

```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cloudflare_app
DB_PORT=3306

# Cloudinary (required)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# API
API_HOST=0.0.0.0
API_PORT=8000
```

### 6. Run the Backend Server

```bash
# Make sure virtual environment is activated
python main.py
```

The API will be available at `http://localhost:8000`

API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- **GET** `/api/health`
- Response: `{"status": "ok"}`

### Submit Form
- **POST** `/api/submit`
- Form Data:
  - `name` (string): User's name
  - `file` (file): Image, PDF, or Word document
- Response: 
  ```json
  {
    "status": "success",
    "message": "File uploaded successfully",
    "submission_id": 1,
    "file_path": "https://..."
  }
  ```

### Get Submissions (Admin)
- **GET** `/api/submissions`
- Response: 
  ```json
  {
    "submissions": [
      {
        "id": 1,
        "name": "John Doe",
        "original_filename": "document.pdf",
        "file_type": "pdf",
        "uploaded_at": "2024-05-23T10:30:00"
      }
    ]
  }
  ```

### File Upload Constraints
- **Allowed file types**: Images (JPG, PNG, GIF, BMP), PDF, Word documents (DOC, DOCX)
- **Maximum file size**: 30MB
- **Storage**: Cloudinary
- **Database**: MySQL with auto-increment ID and UUID-based filename storage

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Verify credentials in `.env` file
- Check database name exists

### File Upload Errors
- Check file size (max 10MB)
- Verify file extension is allowed
- Ensure Cloudflare/Cloudinary credentials are correct

### CORS Issues
- Backend has CORS middleware configured for `http://localhost:5173` (Vite default)
- Adjust in `main.py` if frontend runs on different port
