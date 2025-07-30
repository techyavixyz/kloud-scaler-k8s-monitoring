# Kloud-scaler Kubernetes Monitoring Dashboard

A modern, interactive, and extensible web dashboard that empowers DevOps engineers, SREs, and developers with full visibility into their Kubernetes clusters.

## Features

✅ **Microservices backend architecture** with API integration  
📊 **Live namespace-wise CPU & memory usage** auto-refresh every 10s  
📝 **Stream, tail, and search logs** in real-time with keyword/regex  
🖥 **Fullscreen & draggable popup log view** with auto-scroll  
🔄 **Context switcher** for managing multiple K8s clusters  
📥 **Export and download logs** for audit/debugging  
🔍 **Smart pod listing** and app label-based filtering  
🎨 **Modern UI** with dark/light theme support  
📱 **Responsive design** for all devices  
⚡ **Real-time updates** via WebSocket connections  

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + WebSocket + PostgreSQL
- **Charts**: Chart.js for data visualization
- **Database**: PostgreSQL for metrics and logs storage
- **Deployment**: Docker, Kubernetes, or traditional server

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- kubectl configured with cluster access
- Docker (optional)

### Installation

1. **Clone and setup**:
```bash
git clone <your-repo>
cd k8s-monitoring-dashboard
npm install
```

2. **Setup database**:
```sql
CREATE DATABASE k8s_monitoring;
CREATE USER k8s_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE k8s_monitoring TO k8s_admin;
```

3. **Configure environment**:
```bash
cp server/.env.example server/.env
# Edit server/.env with your database credentials
```

4. **Install backend dependencies**:
```bash
cd server
npm install
cd ..
```

5. **Start the application**:
```bash
# Start backend
npm run server &

# Start frontend
npm run dev
```

Visit `http://localhost:5173` to access the dashboard.

## Project Structure

```
k8s-monitoring-dashboard/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts (Theme, WebSocket)
│   ├── pages/             # Main application pages
│   ├── services/          # API service layer
│   └── utils/             # Utility functions
├── server/                # Express backend
│   ├── index.js          # Main server file
│   └── package.json      # Backend dependencies
├── public/               # Static assets
└── docs/                # Documentation
```

## API Endpoints

### Resource Usage
- `GET /api/resource-usage` - Get current resource usage by namespace
- `GET /api/metrics/history/:namespace` - Get historical metrics

### Pod Management
- `GET /api/pods?namespace=<ns>` - List pods in namespace
- `GET /api/logs` - Get pod logs with filtering

### Context Management
- `GET /api/contexts` - List available Kubernetes contexts
- `POST /api/contexts/set` - Switch to different context

### Namespaces
- `GET /api/namespaces` - List all namespaces

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Traditional server deployment
- Docker containerization
- Kubernetes deployment
- Security considerations
- Monitoring and maintenance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section in DEPLOYMENT.md
- Review the API documentation

---

**Created by Abhinash Dubey** - Kloud-scaler Monitoring Dashboard © 2025