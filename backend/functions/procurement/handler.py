import os
import sys

# Ensure package root is on sys.path if invoked directly
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.handlers.procurement import handler as app_handler, lambda_handler as app_lambda_handler

# Direct delegation to modular app handler
handler = app_handler
lambda_handler = app_lambda_handler

__all__ = ["handler", "lambda_handler"]
