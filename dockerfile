# Use the official Python image from the Docker Hub
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file into the image
COPY requirements.txt requirements.txt

# Install the dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application code into the image
COPY . .

# Set the environment variable to tell Flask to run in production
ENV FLASK_ENV=production

# Expose the port that Flask will run on
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "python create_tables.py && gunicorn -w 4 -b 0.0.0.0:8000 app:app"]
