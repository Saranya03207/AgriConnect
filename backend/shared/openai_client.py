import os
import json
import boto3
from botocore.exceptions import ClientError
from typing import Optional
from openai import OpenAI, OpenAIError
from shared.logging import get_logger

logger = get_logger('openai-client')

# Cached API key and client instance to reuse across warm Lambda invocations
_CACHED_API_KEY: Optional[str] = None
_CACHED_CLIENT: Optional[OpenAI] = None

def get_secret_name() -> str:
    """Returns the Secrets Manager secret name storing the OpenAI key."""
    return os.environ.get('OPENAI_SECRET_NAME', 'AgriConnect/OpenAI')

def get_default_model() -> str:
    """Returns the configured OpenAI model name, defaulting to gpt-4o-mini."""
    return os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')

def get_openai_api_key() -> str:
    """
    Retrieves the OpenAI API key securely from AWS Secrets Manager or cached memory.
    Supports local development fallback via OPENAI_API_KEY environment variable.
    Ensures the raw key is never written to logs.
    """
    global _CACHED_API_KEY
    if _CACHED_API_KEY:
        return _CACHED_API_KEY

    # 1. Optional direct environment variable (useful for local development/testing)
    direct_key = os.environ.get('OPENAI_API_KEY')
    if direct_key and direct_key.strip():
        _CACHED_API_KEY = direct_key.strip()
        logger.info("OpenAI API key loaded from environment variable")
        return _CACHED_API_KEY

    # 2. Fetch from AWS Secrets Manager
    secret_name = get_secret_name()
    region_name = os.environ.get('AWS_REGION', 'us-east-1')
    
    logger.info(f"Retrieving OpenAI secret from Secrets Manager: {secret_name}")
    client = boto3.client('secretsmanager', region_name=region_name)
    
    try:
        response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        logger.error(f"Failed to fetch secret '{secret_name}' from Secrets Manager: {e.response['Error']['Code']}")
        raise RuntimeError(f"Unable to retrieve OpenAI credentials: {e.response['Error']['Message']}")

    if 'SecretString' in response:
        secret_content = response['SecretString']
        try:
            # Secret might be stored as JSON: {"OPENAI_API_KEY": "..."} or {"api_key": "..."}
            secret_dict = json.loads(secret_content)
            api_key = (
                secret_dict.get('OPENAI_API_KEY') or 
                secret_dict.get('api_key') or 
                secret_dict.get('key')
            )
            if not api_key:
                # If JSON has only one key/value pair, use that value
                if len(secret_dict) == 1:
                    api_key = list(secret_dict.values())[0]
        except (json.JSONDecodeError, AttributeError):
            # Plain string
            api_key = secret_content.strip()
    else:
        raise RuntimeError("Secret binary format is not supported for OpenAI API key")

    if not api_key:
        raise ValueError(f"Secret '{secret_name}' did not contain a valid OpenAI API key")

    _CACHED_API_KEY = api_key
    logger.info("OpenAI API key successfully retrieved and cached from Secrets Manager")
    return _CACHED_API_KEY

def get_openai_client() -> OpenAI:
    """
    Returns an initialized, reusable OpenAI client instance.
    Reuses the client instance across warm container invocations.
    """
    global _CACHED_CLIENT
    if _CACHED_CLIENT:
        return _CACHED_CLIENT

    api_key = get_openai_api_key()
    _CACHED_CLIENT = OpenAI(api_key=api_key)
    return _CACHED_CLIENT

def execute_chat_completion(
    messages: list,
    model: Optional[str] = None,
    temperature: float = 0.2,
    response_format: Optional[dict] = None
) -> dict:
    """
    Executes a chat completion call with standardized error handling and safe logging.
    Keeps raw AI interactions isolated from domain business logic.
    """
    client = get_openai_client()
    selected_model = model or get_default_model()
    
    logger.info(f"Dispatching OpenAI completion request to model: {selected_model}")
    try:
        kwargs = {
            "model": selected_model,
            "messages": messages,
            "temperature": temperature
        }
        if response_format:
            kwargs["response_format"] = response_format
            
        completion = client.chat.completions.create(**kwargs)
        
        choice = completion.choices[0]
        content = choice.message.content
        total_tokens = completion.usage.total_tokens if completion.usage else 0
        
        logger.info(f"OpenAI request successful. Total tokens consumed: {total_tokens}")
        return {
            "content": content,
            "model": selected_model,
            "totalTokens": total_tokens,
            "finishReason": choice.finish_reason
        }
    except OpenAIError as e:
        logger.error(f"OpenAI API invocation failed: {type(e).__name__} - {str(e)}")
        raise e
