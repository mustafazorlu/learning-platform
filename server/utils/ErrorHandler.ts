class ErrorHandler extends Error {
    constructor(message: any, statusCode: Number) {
        statusCode: Number;
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}
export default ErrorHandler;
