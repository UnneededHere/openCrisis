import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = req[target];
            const validated = schema.parse(data);
            req[target] = validated;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors: Record<string, string[]> = {};

                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!formattedErrors[path]) {
                        formattedErrors[path] = [];
                    }
                    formattedErrors[path].push(err.message);
                });

                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: formattedErrors,
                    },
                });
                return;
            }

            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                },
            });
        }
    };
};

export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

export default validate;
