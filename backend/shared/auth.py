from typing import Dict, Optional, Any, Union, List

# Primary Business Roles + Privileged Admin
VALID_ROLES = {
    'SEED_PRODUCER',
    'FARMER',
    'BYPRODUCT_SELLER',
    'BUYER',
    'SERVICE_PROVIDER',
    'PROCESSOR',
    'ADMIN'
}

def get_user_from_event(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts authenticated user claims from API Gateway HTTP API v2 JWT authorizer event.
    Claims are verified upstream by API Gateway against Amazon Cognito User Pool.
    """
    try:
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        jwt_data = authorizer.get('jwt', {})
        claims = jwt_data.get('claims', {})
        
        user_id = claims.get('sub')
        if not user_id:
            return None

        role = claims.get('custom:role', '').upper()
        
        return {
            'userId': user_id,
            'email': claims.get('email', ''),
            'role': role,
            'displayName': claims.get('custom:display_name', ''),
            'claims': claims
        }
    except (KeyError, TypeError, AttributeError):
        return None

def has_role(user: Optional[Dict[str, Any]], required_roles: Union[str, List[str]]) -> bool:
    """
    Checks if authenticated user holds one of the required roles or is ADMIN.
    """
    if not user or not user.get('role'):
        return False
        
    user_role = user['role']
    
    # ADMIN role has superuser access across endpoints
    if user_role == 'ADMIN':
        return True
        
    if isinstance(required_roles, str):
        required_roles = [required_roles]
        
    return user_role in [r.upper() for r in required_roles]
