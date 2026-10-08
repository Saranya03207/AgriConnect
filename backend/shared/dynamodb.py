import os
import boto3

def get_table_name():
    return os.environ.get('TABLE_NAME', 'AgriConnect-Main')

# Re-usable boto3 resource for DynamoDB
dynamodb = boto3.resource('dynamodb')

def get_table():
    return dynamodb.Table(get_table_name())
