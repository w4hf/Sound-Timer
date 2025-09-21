# Use Node.js Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# RUN npm ci --only=production
RUN npm install

# Copy application files
COPY server.js .

# Create public directory for frontend
RUN mkdir -p public

# Copy frontend files
COPY ./public/index.html ./public/

# Create sounds directory
RUN mkdir -p /app/sounds

# Expose port
EXPOSE 3000

# Create a volume for sounds
VOLUME ["/app/sounds"]

# Start the application
CMD ["node", "server.js"]