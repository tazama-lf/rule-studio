FROM node:22-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variables directly in Dockerfile
ENV VITE_API_BASE_URL=http://localhost:3005
ENV VITE_APP_NAME="Tazama Model Management"
ENV VITE_APP_VERSION=0.0.1

# Expose port
EXPOSE 5174

# Start the development server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]