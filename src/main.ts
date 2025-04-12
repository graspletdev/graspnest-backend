import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'debug', 'error', 'warn', 'verbose'],
    });

    // Enable CORS
    app.enableCors({
        origin: 'http://localhost:4200', // Replace with your Angular app's URL
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    app.use(bodyParser.json());

    // Use validation pipe globally
    // app.useGlobalPipes(new ValidationPipe());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('GraspNest API')
        .setDescription('The GraspNest API description')
        .setVersion('1.0')
        .addTag('auth')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    console.log('Starting server...');
    await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}

bootstrap().catch((error) => {
    console.error(error);
});
