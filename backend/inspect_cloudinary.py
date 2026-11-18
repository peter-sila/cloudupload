#!/usr/bin/env python3
import os
import json
import cloudinary
import cloudinary.api
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
)

public_id = 'submissions/ec24b13c-fc35-4225-aebc-0bf3fb395582.pdf'
for rt in ['raw', 'image', 'auto']:
    try:
        res = cloudinary.api.resource(public_id, resource_type=rt)
        print(f'resource_type={rt} public_id={res.get("public_id")} type={res.get("type")} access_mode={res.get("access_mode")}')
        print(json.dumps(res, indent=2)[:1000])
    except Exception as e:
        print(f'resource_type={rt} error={e}')
