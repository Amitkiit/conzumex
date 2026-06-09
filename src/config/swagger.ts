import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const routePath = [
  './src/routes/*.ts',
  './dist/src/routes/*.js',
];

const swaggerServerUrl =
  process.env.SWAGGER_SERVER_URL ||
  `http://localhost:${env.port}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Conzumex API',
      version: '1.0.0',
      description: 'API documentation for the Conzumex backend',
    },
    servers: [
      {
        url: swaggerServerUrl,
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
    security: [{ bearerAuth: [] }],
  },
  apis: routePath,
};

export const swaggerSpec = swaggerJSDoc(options);