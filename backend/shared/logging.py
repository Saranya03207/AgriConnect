import logging
import json

class CustomJsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "level": record.levelname,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def get_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates in Lambda
    if logger.handlers:
        logger.handlers.clear()
        
    handler = logging.StreamHandler()
    handler.setFormatter(CustomJsonFormatter())
    logger.addHandler(handler)
    
    return logger
