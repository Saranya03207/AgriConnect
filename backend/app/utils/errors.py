class AppError(Exception):
    """Base application exception with HTTP status code support."""

    def __init__(self, message: str = "An internal error occurred", status_code: int = 500, error_code: str = "INTERNAL_ERROR", details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class ValidationError(AppError):
    """Raised when client request payload or parameters fail validation."""

    def __init__(self, message: str = "Validation failed", details: dict = None):
        super().__init__(message=message, status_code=400, error_code="VALIDATION_ERROR", details=details)


class UnauthorizedError(AppError):
    """Raised when request lacks valid authentication credentials."""

    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(message=message, status_code=401, error_code="UNAUTHORIZED")


class ForbiddenError(AppError):
    """Raised when authenticated user lacks required permissions or role."""

    def __init__(self, message: str = "Forbidden: insufficient permissions"):
        super().__init__(message=message, status_code=403, error_code="FORBIDDEN")


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=404, error_code="NOT_FOUND")


class ConflictError(AppError):
    """Raised when a resource state conflict occurs (e.g. conditional check failure)."""

    def __init__(self, message: str = "Resource state conflict"):
        super().__init__(message=message, status_code=409, error_code="CONFLICT")


class InternalServerError(AppError):
    """Raised when an unhandled server error occurs."""

    def __init__(self, message: str = "Internal server error"):
        super().__init__(message=message, status_code=500, error_code="INTERNAL_SERVER_ERROR")
