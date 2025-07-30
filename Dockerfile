# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Backend stage
FROM node:18-alpine
WORKDIR /app

# Install kubectl
RUN apk add --no-cache curl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Copy backend code
COPY server/ ./server/
COPY --from=frontend-build /app/dist ./dist

# Install dependencies
WORKDIR /app/server
RUN npm ci --only=production

EXPOSE 3001
CMD ["node", "index.js"]