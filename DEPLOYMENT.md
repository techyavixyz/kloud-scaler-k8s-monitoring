# Kloud-scaler Kubernetes Monitoring Dashboard

## Deployment Guide

### Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v13 or higher)
3. **kubectl** configured with cluster access
4. **Docker** (optional, for containerized deployment)

### Quick Start

#### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd k8s-monitoring-dashboard

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

#### 2. Database Setup

```sql
-- Create database
CREATE DATABASE k8s_monitoring;

-- Create user (optional)
CREATE USER k8s_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE k8s_monitoring TO k8s_admin;
```

#### 3. Environment Configuration

Create `server/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=k8s_monitoring
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=your-super-secret-jwt-key-here
```

#### 4. Build and Start

```bash
# Build frontend
npm run build

# Start backend server
npm run server &

# Start frontend (development)
npm run dev

# OR serve built frontend with a static server
npx serve dist -p 5173
```

### Production Deployment

#### Option 1: Traditional Server Deployment

1. **Setup on Ubuntu/CentOS server:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Deploy application:**

```bash
# Clone and build
git clone <your-repo-url>
cd k8s-monitoring-dashboard
npm install
npm run build

# Setup environment
cp server/.env.example server/.env
# Edit server/.env with your configuration

# Start with PM2
pm2 start server/index.js --name "k8s-monitoring-api"
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt-get install -y nginx
```

3. **Nginx configuration** (`/etc/nginx/sites-available/k8s-monitoring`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/k8s-monitoring-dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Option 2: Docker Deployment

1. **Create Dockerfile:**

```dockerfile
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
```

2. **Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: k8s_monitoring
      POSTGRES_USER: k8s_admin
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  k8s-monitoring:
    build: .
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: k8s_monitoring
      DB_USER: k8s_admin
      DB_PASSWORD: secure_password
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    volumes:
      - ~/.kube:/root/.kube:ro  # Mount kubeconfig
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl  # SSL certificates
    depends_on:
      - k8s-monitoring
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Option 3: Kubernetes Deployment

1. **Create Kubernetes manifests:**

```yaml
# k8s-monitoring-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: k8s-monitoring
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: k8s-monitoring
  template:
    metadata:
      labels:
        app: k8s-monitoring
    spec:
      serviceAccountName: k8s-monitoring
      containers:
      - name: k8s-monitoring
        image: your-registry/k8s-monitoring:latest
        ports:
        - containerPort: 3001
        env:
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: kubeconfig
          mountPath: /root/.kube
          readOnly: true
      volumes:
      - name: kubeconfig
        secret:
          secretName: kubeconfig-secret

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: k8s-monitoring
  namespace: monitoring

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: k8s-monitoring
rules:
- apiGroups: [""]
  resources: ["pods", "namespaces"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: k8s-monitoring
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: k8s-monitoring
subjects:
- kind: ServiceAccount
  name: k8s-monitoring
  namespace: monitoring
```

### Security Considerations

1. **Database Security:**
   - Use strong passwords
   - Enable SSL connections
   - Limit database access to application servers only

2. **Kubernetes Access:**
   - Use service accounts with minimal required permissions
   - Rotate kubeconfig credentials regularly
   - Enable audit logging

3. **Network Security:**
   - Use HTTPS/TLS for all connections
   - Implement proper CORS policies
   - Use firewall rules to restrict access

4. **Application Security:**
   - Keep dependencies updated
   - Use environment variables for secrets
   - Implement rate limiting
   - Enable security headers

### Monitoring and Maintenance

1. **Health Checks:**
   - Configure liveness/readiness probes
   - Monitor application metrics
   - Set up log aggregation

2. **Backups:**
   - Regular database backups
   - Configuration backups
   - Automated backup verification

3. **Updates:**
   - Automated security updates
   - Rolling deployment strategy
   - Database migration procedures

### Troubleshooting

Common issues and solutions:

1. **kubectl command not found:**
   ```bash
   # Install kubectl in the container/server
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

2. **Database connection issues:**
   - Check firewall rules
   - Verify credentials
   - Ensure PostgreSQL is accepting connections

3. **WebSocket connection failures:**
   - Check proxy configuration
   - Verify CORS settings
   - Ensure proper headers are set

For additional support, check the application logs and refer to the documentation.