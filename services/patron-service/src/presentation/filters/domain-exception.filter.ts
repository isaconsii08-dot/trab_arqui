import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '@biblioflow/shared-errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.warn(`Domain error [${exception.code}]: ${exception.message}`);

    response.status(exception.statusCode).json({
      ...exception.toJSON(),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
