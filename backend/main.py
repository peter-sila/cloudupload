import os
import uuid
from datetime import datetime
from typing import Any, Dict, Optional, Sequence, cast
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
import ssl
import urllib.request
from urllib.error import HTTPError, URLError
import re
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error
import cloudinary
import cloudinary.uploader
import cloudinary.api
import cloudinary.utils

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Cloudflare Upload API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cloudinary configuration (optional for local dev)
# Require Cloudinary configuration for production and development
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not (CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET):
    raise RuntimeError(
        "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env"
    )

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)

# Database configuration
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": int(os.getenv("DB_PORT", 3306)),
}


def get_db_connection():
    """Create and return a database connection."""
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error connecting to database: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")


def save_to_database(name: str, original_filename: str, stored_filename: str, file_path: str, file_type: str):
    """Save submission record to MySQL database."""
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        query = """
        INSERT INTO submissions (name, original_filename, stored_filename, file_path, file_type, uploaded_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        """
        values = (name, original_filename, stored_filename, file_path, file_type)
        cursor.execute(query, values)
        connection.commit()
        return cursor.lastrowid
    except Error as e:
        connection.rollback()
        print(f"Error inserting record: {e}")
        raise HTTPException(status_code=500, detail="Failed to save to database")
    finally:
        cursor.close()
        connection.close()


def get_cloudinary_resource_type(file_type: str) -> str:
    return "image" if file_type == "image" else "raw"


def get_cloudinary_public_id(stored_filename: str) -> str:
    return f"submissions/{stored_filename}"


def make_cloudinary_public(public_id: str, resource_type: str):
    try:
        cloudinary.uploader.explicit(
            public_id,
            type="upload",
            resource_type=resource_type,
            access_mode="public",
        )
    except Exception as e:
        print(f"Error forcing Cloudinary asset public: {e}")


def get_cloudinary_signed_url(public_id: str, resource_type: str) -> str:
    try:
        signed_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type="upload",
            sign_url=True,
        )
        return signed_url
    except Exception as e:
        print(f"Error generating signed Cloudinary URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate signed Cloudinary URL")


def open_url_with_ssl(url: str):
    """Open a URL, retrying with an unverified SSL context if verification fails."""
    try:
        return urllib.request.urlopen(url)
    except ssl.SSLCertVerificationError as ssl_err:
        print(f"SSL verification failed for {url}; retrying without certificate validation: {ssl_err}")
        unverified_context = ssl._create_unverified_context()
        return urllib.request.urlopen(url, context=unverified_context)



def upload_to_cloudflare(file_content: bytes, stored_filename: str, file_type: str):
    """Upload file bytes to Cloudflare R2 storage (via Cloudinary for testing)."""
    resource_type = get_cloudinary_resource_type(file_type)
    public_id = get_cloudinary_public_id(stored_filename)

    try:
        upload_result = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            resource_type=resource_type,
            access_mode="public",
        )

        url = upload_result.get("secure_url", upload_result.get("url"))
        print(f"[DEBUG] Uploaded {file_type} file {stored_filename}. Resource type: {resource_type}. URL: {url}")
        return url
    except Exception as e:
        print(f"Error uploading to Cloudinary: {e}")
        raise HTTPException(status_code=500, detail="File upload failed (Cloudinary error)")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/submit")
async def submit_form(
    name: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handle form submission with name and file upload.
    
    Args:
        name: User's name
        file: Uploaded file (image, PDF, or Word document)
    
    Returns:
        Success message with submission ID
    """
    # Validate file extension
    allowed_extensions = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif", ".bmp"}
    original_filename = file.filename or ""
    if not original_filename:
        raise HTTPException(status_code=400, detail="Uploaded file is missing a filename")

    file_ext = os.path.splitext(original_filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: images (jpg, png, gif, bmp), PDF, or Word documents"
        )
    
    # Validate file size (max 30MB)
    max_size = 30 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 30MB limit")
    
    try:
        # Determine file type
        if file_ext in {".jpg", ".jpeg", ".png", ".gif", ".bmp"}:
            file_type = "image"
        elif file_ext == ".pdf":
            file_type = "pdf"
        else:
            file_type = "document"

        # Generate UUID for stored filename
        stored_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Upload to Cloudflare/Cloudinary with the right resource type
        file_path = upload_to_cloudflare(file_content, stored_filename, file_type)
        
        # Save to database
        submission_id = save_to_database(
            name=name,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=file_path,
            file_type=file_type
        )
        
        return {
            "status": "success",
            "message": "File uploaded successfully",
            "submission_id": submission_id,
            "file_path": file_path
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@app.get("/api/submissions")
async def get_submissions():
    """Retrieve all submissions (for admin purposes)."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = "SELECT id, name, original_filename, stored_filename, file_path, file_type, download, uploaded_at FROM submissions ORDER BY uploaded_at DESC LIMIT 100"
        cursor.execute(query)
        submissions = cast(Sequence[Dict[str, Any]], cursor.fetchall())
        
        # Convert datetime objects to strings and compute preview/download URLs
        for submission in submissions:
            if isinstance(submission['uploaded_at'], datetime):
                submission['uploaded_at'] = submission['uploaded_at'].isoformat()

            submission['preview_url'] = submission['file_path']
            submission['download_url'] = submission['file_path']
        
        return {"submissions": submissions}
    except Error as e:
        print(f"Error retrieving submissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve submissions")
    finally:
        cursor.close()
        connection.close()


@app.get("/api/preview/{submission_id}")
async def preview_submission(submission_id: int):
    """Proxy preview for a submission by streaming the remote file through the backend.
    This avoids browser-side CORS/auth issues with direct Cloudinary raw URLs.
    """
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, original_filename, stored_filename, file_path, file_type, download FROM submissions WHERE id=%s", (submission_id,))
        submission = cast(Optional[Dict[str, Any]], cursor.fetchone())
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        resource_type = get_cloudinary_resource_type(submission["file_type"])
        public_id = get_cloudinary_public_id(submission["stored_filename"])

        if resource_type == "raw":
            file_url = get_cloudinary_signed_url(public_id, resource_type)
        else:
            file_url = submission["file_path"]
            # Strip trailing ":<number>" (DevTools line indicator) if present
            file_url = re.sub(r":\d+$", "", file_url)

        try:
            resp = open_url_with_ssl(file_url)
        except HTTPError as e:
            if e.code in (401, 403):
                print(f"Received {e.code} from Cloudinary; forcing public access for {public_id}")
                make_cloudinary_public(public_id, resource_type)
                try:
                    fallback_url = get_cloudinary_signed_url(public_id, resource_type)
                    resp = open_url_with_ssl(fallback_url)
                except Exception as retry_err:
                    print(f"Retry failed after forcing public or signed URL: {retry_err}")
                    raise HTTPException(status_code=502, detail="Failed to fetch remote file for preview")
            else:
                print(f"HTTPError fetching remote file for preview: {e}")
                raise HTTPException(status_code=502, detail="Failed to fetch remote file for preview")
        except URLError as e:
            print(f"URLError fetching remote file for preview: {e}")
            raise HTTPException(status_code=502, detail="Failed to fetch remote file for preview")
        except Exception as e:
            print(f"Error fetching remote file for preview: {e}")
            raise HTTPException(status_code=502, detail="Failed to fetch remote file for preview")

        content_type = resp.headers.get_content_type() if hasattr(resp, 'headers') else resp.getheader('Content-Type')
        if not content_type:
            content_type = "application/octet-stream"

        def iterfile():
            try:
                chunk = resp.read(8192)
                while chunk:
                    yield chunk
                    chunk = resp.read(8192)
            finally:
                resp.close()

        return StreamingResponse(iterfile(), media_type=content_type)
    finally:
        cursor.close()
        connection.close()


@app.get("/api/download/{submission_id}")
async def download_submission(submission_id: int):
    """Proxy download for a submission. Respects the `download` flag in the DB."""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, original_filename, stored_filename, file_path, file_type, download FROM submissions WHERE id=%s", (submission_id,))
        submission = cast(Optional[Dict[str, Any]], cursor.fetchone())
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        if not submission.get("download"):
            raise HTTPException(status_code=403, detail="Download not permitted for this file")

        resource_type = get_cloudinary_resource_type(submission["file_type"])
        public_id = get_cloudinary_public_id(submission["stored_filename"])

        if resource_type == "raw":
            file_url = get_cloudinary_signed_url(public_id, resource_type)
        else:
            file_url = submission["file_path"]
            # Strip trailing ":<number>" (DevTools line indicator) if present
            file_url = re.sub(r":\d+$", "", file_url)

        try:
            resp = open_url_with_ssl(file_url)
        except HTTPError as e:
            if e.code in (401, 403):
                print(f"Received {e.code} from Cloudinary; forcing public access for {public_id}")
                make_cloudinary_public(public_id, resource_type)
                try:
                    fallback_url = get_cloudinary_signed_url(public_id, resource_type)
                    resp = open_url_with_ssl(fallback_url)
                except Exception as retry_err:
                    print(f"Retry failed after forcing public or signed URL: {retry_err}")
                    raise HTTPException(status_code=502, detail="Failed to fetch remote file for download")
            else:
                print(f"HTTPError fetching remote file for download: {e}")
                raise HTTPException(status_code=502, detail="Failed to fetch remote file for download")
        except URLError as e:
            print(f"URLError fetching remote file for download: {e}")
            raise HTTPException(status_code=502, detail="Failed to fetch remote file for download")
        except Exception as e:
            print(f"Error fetching remote file for download: {e}")
            raise HTTPException(status_code=502, detail="Failed to fetch remote file for download")

        content_type = resp.headers.get_content_type() if hasattr(resp, 'headers') else resp.getheader('Content-Type')
        if not content_type:
            content_type = "application/octet-stream"

        filename = submission.get("original_filename") or "file"

        def iterfile():
            try:
                chunk = resp.read(8192)
                while chunk:
                    yield chunk
                    chunk = resp.read(8192)
            finally:
                resp.close()

        headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
        return StreamingResponse(iterfile(), media_type=content_type, headers=headers)
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000))
    )
