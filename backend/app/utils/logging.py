import json
import logging
import sys
from typing import Optional


class CloudWatchJsonFormatter(logging.Formatter):
    """
    Formats log records as single-line JSON objects suitable for
    Amazon CloudWatch Logs Insights querying.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include extra attributes if provided
        for key, value in record.__dict__.items():
            if key not in {
                "args", "asctime", "created", "exc_info", "exc_text",
                "filename", "funcName", "id", "levelname", "levelno",
                "lineno", "module", "msecs", "message", "msg", "name",
                "pathname", "process", "processName", "relativeCreated",
                "stack_info", "thread", "threadName"
            }:
                # Never print potential secret keys
                if any(secret_term in key.lower() for secret_term in ["secret", "password", "token", "key", "auth"]):
                    log_entry[key] = "[REDACTED]"
                else:
                    log_entry[key] = value

        return json.dumps(log_entry)


def get_logger(name: str = "agriconnect", level: Optional[int] = logging.INFO) -> logging.Logger:
    """
    Creates or retrieves a logger configured with CloudWatchJsonFormatter.
    Prevents duplicate handlers when Lambda warms up.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(CloudWatchJsonFormatter())
        logger.addHandler(handler)

    # Disable propagation to root logger to avoid duplicated logs in Lambda
    logger.propagate = False
    return logger
