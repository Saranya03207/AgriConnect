import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from shared.response import success, options_response
from shared.logging import get_logger

logger = get_logger('messages-handler')

def handler(event, context):
    logger.info(f"Messages handler invoked with routeKey: {event.get('routeKey')}")
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return options_response()

    route_key = event.get('routeKey', '')
    return success({
        "status": "pending_phase_9_implementation",
        "route": route_key
    }, "Messages service foundation active")
