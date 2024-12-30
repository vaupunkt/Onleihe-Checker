# Use the official Python image from the Docker Hub
FROM python:3.10

RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add -

RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list

RUN wget -O /tmp/chromedriver.zip https://chromedriver.storage.googleapis.com/$(curl -s http://chromedriver.storage.googleapis.com/LATEST_RELEASE)/chromedriver_linux64.zip
RUN unzip /tmp/chromedriver.zip chromedriver -d /usr/local/bin/

# Set the working directory
WORKDIR /app

# Copy the requirements file into the image
COPY requirements.txt requirements.txt

# Install the dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the application code into the image
COPY . .

# Set the environment variable to tell Flask to run in production
ENV FLASK_ENV=production

# Expose the port that Flask will run on
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "./wait-for-it.sh db:3306 -- python create_tables.py && gunicorn -w 4 -b 0.0.0.0:8000 app:app"]

