
import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const routePath: readonly string[] = ['./src/routes/*.ts'];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Conzumex API',
      version: '1.0.0',
      description: 'API documentation for the Conzumex backend',
    },
    servers: [{ url: `http://localhost:${env.port}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: routePath,
};

export const swaggerSpec = swaggerJSDoc(options);
