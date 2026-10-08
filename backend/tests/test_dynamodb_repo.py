from unittest.mock import MagicMock
import pytest
from botocore.exceptions import ClientError
from app.repositories.dynamodb_repo import DynamoDBRepository
from app.utils.errors import AppError, ConflictError, NotFoundError


@pytest.fixture
def mock_table():
    table = MagicMock()
    return table


@pytest.fixture
def repo(mock_table):
    mock_resource = MagicMock()
    mock_resource.Table.return_value = mock_table
    return DynamoDBRepository(table_name="AgriConnect-Main", dynamodb_resource=mock_resource)


def test_get_item_found(repo, mock_table):
    sample_item = {"PK": "USER#123", "SK": "PROFILE", "email": "test@test.com"}
    mock_table.get_item.return_value = {"Item": sample_item}

    result = repo.get_item(key={"PK": "USER#123", "SK": "PROFILE"})
    assert result == sample_item
    mock_table.get_item.assert_called_once_with(
        Key={"PK": "USER#123", "SK": "PROFILE"},
        ConsistentRead=False,
    )


def test_get_item_not_found(repo, mock_table):
    mock_table.get_item.return_value = {}

    result = repo.get_item(key={"PK": "USER#999", "SK": "PROFILE"})
    assert result is None


def test_get_item_table_not_found(repo, mock_table):
    mock_table.get_item.side_effect = ClientError(
        {"Error": {"Code": "ResourceNotFoundException", "Message": "Table not found"}},
        "GetItem",
    )
    with pytest.raises(NotFoundError):
        repo.get_item(key={"PK": "USER#123", "SK": "PROFILE"})


def test_put_item_success(repo, mock_table):
    item = {"PK": "USER#123", "SK": "PROFILE", "displayName": "Ramesh"}
    mock_table.put_item.return_value = {}

    result = repo.put_item(item=item)
    assert result == item
    mock_table.put_item.assert_called_once_with(Item=item)


def test_put_item_condition_failure(repo, mock_table):
    mock_table.put_item.side_effect = ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "Condition failed"}},
        "PutItem",
    )
    with pytest.raises(ConflictError):
        repo.put_item(item={"PK": "USER#123", "SK": "PROFILE"}, condition_expression="attribute_not_exists(PK)")


def test_update_item_success(repo, mock_table):
    updated_attrs = {"PK": "USER#123", "SK": "PROFILE", "phone": "+919876543210"}
    mock_table.update_item.return_value = {"Attributes": updated_attrs}

    key = {"PK": "USER#123", "SK": "PROFILE"}
    result = repo.update_item(
        key=key,
        update_expression="SET #p = :p",
        expression_attribute_names={"#p": "phone"},
        expression_attribute_values={":p": "+919876543210"},
    )
    assert result == updated_attrs
    mock_table.update_item.assert_called_once_with(
        Key=key,
        UpdateExpression="SET #p = :p",
        ReturnValues="ALL_NEW",
        ExpressionAttributeNames={"#p": "phone"},
        ExpressionAttributeValues={":p": "+919876543210"},
    )


def test_update_item_condition_failure(repo, mock_table):
    mock_table.update_item.side_effect = ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "Condition failed"}},
        "UpdateItem",
    )
    with pytest.raises(ConflictError):
        repo.update_item(
            key={"PK": "USER#123", "SK": "PROFILE"},
            update_expression="SET #n = :n",
            condition_expression="attribute_exists(PK)",
        )


def test_delete_item_success(repo, mock_table):
    mock_table.delete_item.return_value = {}
    key = {"PK": "USER#123", "SK": "PROFILE"}
    res = repo.delete_item(key=key)
    assert res is True
    mock_table.delete_item.assert_called_once_with(Key=key)


def test_delete_item_condition_failure(repo, mock_table):
    mock_table.delete_item.side_effect = ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "Condition failed"}},
        "DeleteItem",
    )
    with pytest.raises(ConflictError):
        repo.delete_item(key={"PK": "USER#123", "SK": "PROFILE"}, condition_expression="attribute_exists(PK)")


def test_query_success(repo, mock_table):
    items = [{"PK": "USER#123", "SK": "PROFILE"}]
    mock_table.query.return_value = {"Items": items, "LastEvaluatedKey": {"PK": "USER#123"}}

    res_items, last_key = repo.query(
        key_condition_expression="PK = :pk",
        expression_attribute_values={":pk": "USER#123"},
        limit=10,
    )
    assert res_items == items
    assert last_key == {"PK": "USER#123"}
    mock_table.query.assert_called_once_with(
        KeyConditionExpression="PK = :pk",
        ScanIndexForward=True,
        ExpressionAttributeValues={":pk": "USER#123"},
        Limit=10,
        ConsistentRead=False,
    )


def test_query_failure(repo, mock_table):
    mock_table.query.side_effect = ClientError(
        {"Error": {"Code": "ValidationException", "Message": "Invalid key condition"}},
        "Query",
    )
    with pytest.raises(AppError) as exc_info:
        repo.query(key_condition_expression="invalid")
    assert exc_info.value.status_code == 500


def test_scan_success(repo, mock_table):
    items = [{"PK": "USER#1"}, {"PK": "USER#2"}]
    mock_table.scan.return_value = {"Items": items}

    res_items, last_key = repo.scan(limit=5)
    assert res_items == items
    assert last_key is None
    mock_table.scan.assert_called_once_with(Limit=5)
