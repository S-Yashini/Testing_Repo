class AppException(Exception):
    """
    Base exception class for application errors.
    """

    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, message="Resource not found"):
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=404,
        )


class BadRequestException(AppException):
    def __init__(self, message="Invalid request"):
        super().__init__(
            code="BAD_REQUEST",
            message=message,
            status_code=400,
        )


class UnauthorizedException(AppException):
    def __init__(self, message="Unauthorized"):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=401,
        )
