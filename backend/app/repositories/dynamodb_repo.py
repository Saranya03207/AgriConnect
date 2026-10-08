import os
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple
import boto3
from botocore.exceptions import ClientError
from app.config.settings import get_settings
from app.utils.errors import AppError, ConflictError, NotFoundError
from app.utils.logging import get_logger

logger = get_logger("dynamodb-repo")


class DynamoDBRepository:
    """
    Reusable DynamoDB client and repository abstraction targeting the
    single-table design in 'AgriConnect-Main'.

    Supports:
      - GetItem
      - PutItem
      - UpdateItem
      - DeleteItem
      - Query
      - Scan
    """

    def __init__(self, table_name: Optional[str] = None, dynamodb_resource: Optional[Any] = None):
        settings = get_settings()
        self.table_name = table_name or settings.table_name

        if dynamodb_resource is not None:
            self._resource = dynamodb_resource
        else:
            # Reuses standard boto3 resource configured via environment
            self._resource = boto3.resource("dynamodb", region_name=settings.aws_region)

        self._table = self._resource.Table(self.table_name)

    @property
    def table(self):
        return self._table

    def get_item(
        self,
        key: Dict[str, Any],
        consistent_read: bool = False,
        projection_expression: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single item by primary key (PK + SK).
        Returns None if the item does not exist.
        """
        params: Dict[str, Any] = {
            "Key": key,
            "ConsistentRead": consistent_read,
        }
        if projection_expression:
            params["ProjectionExpression"] = projection_expression
        if expression_attribute_names:
            params["ExpressionAttributeNames"] = expression_attribute_names

        try:
            response = self._table.get_item(**params)
            return response.get("Item")
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"DynamoDB GetItem failed ({code}): {msg}")
            if code == "ResourceNotFoundException":
                raise NotFoundError(f"Table '{self.table_name}' not found")
            raise AppError(f"Database error during GetItem: {msg}", status_code=500)

    def put_item(
        self,
        item: Dict[str, Any],
        condition_expression: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Creates or completely replaces an item in the table.
        Optionally accepts a condition expression for idempotency or uniqueness.
        """
        params: Dict[str, Any] = {"Item": item}
        if condition_expression:
            params["ConditionExpression"] = condition_expression
        if expression_attribute_names:
            params["ExpressionAttributeNames"] = expression_attribute_names
        if expression_attribute_values:
            params["ExpressionAttributeValues"] = expression_attribute_values

        try:
            self._table.put_item(**params)
            return item
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"DynamoDB PutItem failed ({code}): {msg}")
            if code == "ConditionalCheckFailedException":
                raise ConflictError("Item could not be created because condition check failed")
            raise AppError(f"Database error during PutItem: {msg}", status_code=500)

    def update_item(
        self,
        key: Dict[str, Any],
        update_expression: str,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
        condition_expression: Optional[str] = None,
        return_values: str = "ALL_NEW",
    ) -> Optional[Dict[str, Any]]:
        """
        Atomically updates specific attributes of an item.
        """
        params: Dict[str, Any] = {
            "Key": key,
            "UpdateExpression": update_expression,
            "ReturnValues": return_values,
        }
        if expression_attribute_names:
            params["ExpressionAttributeNames"] = expression_attribute_names
        if expression_attribute_values:
            params["ExpressionAttributeValues"] = expression_attribute_values
        if condition_expression:
            params["ConditionExpression"] = condition_expression

        try:
            response = self._table.update_item(**params)
            return response.get("Attributes")
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"DynamoDB UpdateItem failed ({code}): {msg}")
            if code == "ConditionalCheckFailedException":
                raise ConflictError("Item update condition check failed")
            raise AppError(f"Database error during UpdateItem: {msg}", status_code=500)

    def delete_item(
        self,
        key: Dict[str, Any],
        condition_expression: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Deletes an item from the table by primary key.
        """
        params: Dict[str, Any] = {"Key": key}
        if condition_expression:
            params["ConditionExpression"] = condition_expression
        if expression_attribute_names:
            params["ExpressionAttributeNames"] = expression_attribute_names
        if expression_attribute_values:
            params["ExpressionAttributeValues"] = expression_attribute_values

        try:
            self._table.delete_item(**params)
            return True
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"DynamoDB DeleteItem failed ({code}): {msg}")
            if code == "ConditionalCheckFailedException":
                raise ConflictError("Item delete condition check failed")
            raise AppError(f"Database error during DeleteItem: {msg}", status_code=500)

    def query(
        self,
        key_condition_expression: Any,
        index_name: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
        filter_expression: Optional[Any] = None,
        scan_index_forward: bool = True,
        limit: Optional[int] = None,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
        consistent_read: bool = False,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Queries items by partition key and optional sort key range condition.
        Returns a tuple of (items, last_evaluated_key).
        """
        params: Dict[str, Any] = {
            "KeyConditionExpression": key_condition_expression,
            "ScanIndexForward": scan_index_forward,
        }
        if index_name:
            params["IndexName"] = index_name
        else:
            # Consistent read is only supported on primary index
            params["ConsistentRead"] = consistent_read

        if expression_attribute_names:
            params["ExpressionAttributeNames"] = expression_attribute_names
        if expression_attribute_values:
            params["ExpressionAttributeValues"] = expression_attribute_values
        if filter_expression:
            params["FilterExpression"] = filter_expression
        if limit:
            params["Limit"] = limit
        if exclusive_start_key:
            params["ExclusiveStartKey"] = exclusive_start_key

        try:
            response = self._table.query(**params)
            items = response.get("Items", [])
            last_key = response.get("LastEvaluatedKey")
            return items, last_key
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"DynamoDB Query failed ({code}): {msg}")
            raise AppError(f"Database error during Query: {msg}", status_code=500)

    def scan(
        self,
        filter_expression: Optional[Any] = None,
        index_name: Optional[str] = None,
        expression_attribute_names: Optional[Dict[str, str]] = None,
        expression_attribute_values: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        exclusive_start_key: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Scans items in table or index.
        Returns a tuple of (items, last_evaluated_key).
        """
        params: Dict[str, Any] = {}
        if index_name:
            params["IndexName"] = index_name
        if filter_expression:
            params["FilterExpression"] = filter_expression
        if expression_attribute_names:
            params["ExpressionAttributeNames"] = expression_attribute_names
        if expression_attribute_values:
            params["ExpressionAttributeValues"] = expression_attribute_values
        if limit:
            params["Limit"] = limit
        if exclusive_start_key:
            params["ExclusiveStartKey"] = exclusive_start_key

        try:
            response = self._table.scan(**params)
            items = response.get("Items", [])
            last_key = response.get("LastEvaluatedKey")
            return items, last_key
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            msg = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"DynamoDB Scan failed ({code}): {msg}")
            raise AppError(f"Database error during Scan: {msg}", status_code=500)


@lru_cache(maxsize=1)
def get_dynamodb_repository() -> DynamoDBRepository:
    """Return a singleton instance of DynamoDBRepository."""
    return DynamoDBRepository()
