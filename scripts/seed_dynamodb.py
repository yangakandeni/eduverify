"""Bulk-upload data/institutions.json into the eduverify-institutions DynamoDB table.

Usage:
    python scripts/seed_dynamodb.py
    python scripts/seed_dynamodb.py --table-name eduverify-institutions --region af-south-1
    python scripts/seed_dynamodb.py --endpoint-url http://localhost:8000   # DynamoDB Local
"""

import argparse
import json
import sys
from pathlib import Path

import boto3

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATA_PATH = BASE_DIR / "data" / "institutions.json"

sys.path.insert(0, str(BASE_DIR / "parser"))
from dynamo_item import to_item  # noqa: E402


def seed(table, institutions):
    written = 0
    with table.batch_writer() as batch:
        for institution in institutions:
            batch.put_item(Item=to_item(institution))
            written += 1
    return written


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-path", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--table-name", default="eduverify-institutions")
    parser.add_argument("--region", default="af-south-1")
    parser.add_argument(
        "--endpoint-url",
        default=None,
        help="Override endpoint, e.g. http://localhost:8000 for DynamoDB Local",
    )
    args = parser.parse_args()

    if not args.data_path.exists():
        print(f"Error: {args.data_path} does not exist", file=sys.stderr)
        return 1

    institutions = json.loads(args.data_path.read_text())

    dynamodb = boto3.resource("dynamodb", region_name=args.region, endpoint_url=args.endpoint_url)
    table = dynamodb.Table(args.table_name)

    written = seed(table, institutions)
    print(f"Wrote {written} institutions to table '{args.table_name}'")
    return 0


if __name__ == "__main__":
    sys.exit(main())
