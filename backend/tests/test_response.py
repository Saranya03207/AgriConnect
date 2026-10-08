import json
from decimal import Decimal
from app.utils.response import (
    DecimalEncoder,
    build_response,
    created,
    error_response,
    get_cors_headers,
    options_response,
    success,
)


def test_cors_headers():
    headers = get_cors_headers()
    assert headers["Access-Control-Allow-Origin"] == "*"
    assert "Content-Type" in headers["Access-Control-Allow-Headers"]
    assert "GET,POST,PUT,DELETE,OPTIONS" in headers["Access-Control-Allow-Methods"]


def test_build_response_basic():
    res = build_response(200, {"hello": "world"})
    assert res["statusCode"] == 200
    assert "headers" in res
    body = json.loads(res["body"])
    assert body["hello"] == "world"


def test_success_helper():
    res = success(data={"id": "123"}, message="Item retrieved")
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body["success"] is True
    assert body["message"] == "Item retrieved"
    assert body["data"]["id"] == "123"


def test_created_helper():
    res = created(data={"id": "new_1"}, message="Created item")
    assert res["statusCode"] == 201
    body = json.loads(res["body"])
    assert body["success"] is True
    assert body["message"] == "Created item"
    assert body["data"]["id"] == "new_1"


def test_error_response_helper():
    res = error_response(
        message="Resource not found",
        status_code=404,
        error_code="NOT_FOUND",
        details={"resourceId": "456"},
    )
    assert res["statusCode"] == 404
    body = json.loads(res["body"])
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["message"] == "Resource not found"
    assert body["error"]["details"]["resourceId"] == "456"


def test_options_response():
    res = options_response()
    assert res["statusCode"] == 200
    assert res["headers"]["Access-Control-Allow-Origin"] == "*"
    assert res["body"] == ""


def test_decimal_encoder():
    data = {
        "integer_dec": Decimal("100"),
        "float_dec": Decimal("99.95"),
        "nested": {"price": Decimal("15.50")},
    }
    encoded = json.dumps(data, cls=DecimalEncoder)
    decoded = json.loads(encoded)
    assert decoded["integer_dec"] == 100
    assert isinstance(decoded["integer_dec"], int)
    assert decoded["float_dec"] == 99.95
    assert isinstance(decoded["float_dec"], float)
    assert decoded["nested"]["price"] == 15.5
