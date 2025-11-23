import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InsightCast API Documentation',
      version: '1.0.0',
      description: 'API สำหรับจัดการระบบนิยายและพอดแคสต์ InsightCast',
      contact: {
        name: 'Admin Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
      {
        // ⚠️ อย่าลืมเปลี่ยน URL นี้เป็น URL ของ Render ของคุณเมื่อ Deploy
        url: 'https://your-project.onrender.com', 
        description: 'Production Server (Render)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // ระบุตำแหน่งไฟล์ที่มี JSDoc Comments (Routes)
  apis: [path.join(__dirname, './routes/*.js')], 
};

export default swaggerOptions;