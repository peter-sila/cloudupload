# Cloud Upload

## Run with Docker Compose

1. Create a `.env` file in the project root with your database and Cloudinary credentials:

   ```dotenv
   DB_PASSWORD=choose-a-database-password
   DB_ROOT_PASSWORD=choose-a-mysql-root-password
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

   `DB_USER` is optional and defaults to `cloudupload`.

2. Build and start the services:

   ```sh
   docker compose up --build
   ```

3. Open the frontend at [http://localhost:8080](http://localhost:8080). The API is also available at [http://localhost:8000/docs](http://localhost:8000/docs).

Compose initializes MySQL from `backend/database.sql` on the first run and waits for the database and API health checks before starting dependent services. Database files persist in the `mysql_data` volume. To stop the services, run `docker compose down`; to also delete the database volume, run `docker compose down --volumes`.

Do not commit the root `.env` file. The frontend is served through Nginx, which proxies `/api` requests to the backend container.
