import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';

// src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    console.log(`➡️  ${req.method} ${req.url}`);

    return next.handle().pipe(
      tap(() => console.log(`⬅️  ${req.method} ${req.url} ${Date.now() - now}ms`)),
    );
  }
}
