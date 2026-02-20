import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class DatabaseErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
        ) {
          if (error.code === 'P2002') {
            // Unique constraint failed
            return throwError(() => ({
              statusCode: 409,
              message: 'Unique constraint violation',
              error: 'Conflict',
              details: error.meta,
            }));
          }
          if (error.code === 'P2025') {
            // Not found
            return throwError(() => ({
              statusCode: 404,
              message: 'Resource not found',
              error: 'Not Found',
              details: error.meta,
            }));
          }
        }
        return throwError(() => error);
      })
    );
  }
}
