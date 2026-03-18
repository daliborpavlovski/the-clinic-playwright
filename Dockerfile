FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Default command runs all tests
CMD ["npx", "playwright", "test"]
