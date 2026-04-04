import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as proxy from 'express-http-proxy';

// ─────────────────────────────────────────────────────────────────────────────
// ProxyMiddleware – Routes requests to the appropriate microservice
// ─────────────────────────────────────────────────────────────────────────────

interface RouteConfig {
  prefix: string;
  target: string;
}

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);

  private routes: RouteConfig[];

  constructor(private readonly config: ConfigService) {
    this.routes = [
      { prefix: '/api/auth', target: config.get('PATRON_SERVICE_URL', 'http://localhost:3001') },
      { prefix: '/api/patrons', target: config.get('PATRON_SERVICE_URL', 'http://localhost:3001') },
      { prefix: '/api/catalog', target: config.get('CATALOG_SERVICE_URL', 'http://localhost:3002') },
      { prefix: '/api/holdings', target: config.get('HOLDINGS_SERVICE_URL', 'http://localhost:3003') },
      { prefix: '/api/circulation', target: config.get('CIRCULATION_SERVICE_URL', 'http://localhost:3004') },
      { prefix: '/api/spaces', target: config.get('SPACE_SERVICE_URL', 'http://localhost:3005') },
      { prefix: '/api/acquisitions', target: config.get('ACQUISITIONS_SERVICE_URL', 'http://localhost:3006') },
      { prefix: '/api/analytics', target: config.get('ANALYTICS_SERVICE_URL', 'http://localhost:3007') },
    ];
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const route = this.routes.find((r) => req.path.startsWith(r.prefix));

    if (!route) {
      next();
      return;
    }

    this.logger.debug(`Proxying ${req.method} ${req.path} → ${route.target}`);

    proxy(route.target, {
      proxyReqPathResolver: (req) => `/api/v1${req.url}`,
      proxyErrorHandler: (err, _res, next) => {
        this.logger.error(`Proxy error for ${req.path}`, err);
        next(err);
      },
    })(req, res, next);
  }
}
