import { Response } from 'express';

export class ApiResponse {
    static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    static error(res: Response, message: string, statusCode: number = 500, errors?: any) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    static paginated(
        res: Response,
        data: any[],
        page: number,
        limit: number,
        total: number,
        message: string = 'Success'
    ) {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
}
