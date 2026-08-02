import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { InstitutionRecord } from "./types";

const TABLE_NAME = process.env.EDUVERIFY_TABLE_NAME ?? "eduverify-institutions";
const REGION = process.env.AWS_REGION ?? "af-south-1";
const REQUEST_TIMEOUT_MS = 2500;

/** GSI1PK values written by parser/dynamo_item.py (institution.status, uppercased, or UNKNOWN). */
const STATUS_PARTITIONS = ["REGISTERED", "PROVISIONALLY REGISTERED", "UNKNOWN"];

let client: DynamoDBDocumentClient | null = null;

function getClient(): DynamoDBDocumentClient {
  if (!client) {
    client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: REGION,
        requestHandler: { requestTimeout: REQUEST_TIMEOUT_MS },
      })
    );
  }
  return client;
}

function toRecord(item: Record<string, unknown>): InstitutionRecord {
  const record = { ...item };
  const id = record.PK as string;
  delete record.PK;
  delete record.GSI1PK;
  delete record.GSI1SK;
  return { ...(record as Omit<InstitutionRecord, "id">), id };
}

export async function getInstitutionByPK(pk: string): Promise<InstitutionRecord | null> {
  const result = await getClient().send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } }));
  return result.Item ? toRecord(result.Item) : null;
}

export async function getInstitutionByRegistrationNumber(
  registrationNumber: string
): Promise<InstitutionRecord | null> {
  return getInstitutionByPK(`INST#${registrationNumber}`);
}

/** GSI1 name search: queries each known status partition for names beginning with `prefix`. */
export async function queryByNamePrefix(prefix: string): Promise<InstitutionRecord[]> {
  const docClient = getClient();
  const responses = await Promise.all(
    STATUS_PARTITIONS.map((status) =>
      docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :status AND begins_with(GSI1SK, :prefix)",
          ExpressionAttributeValues: { ":status": status, ":prefix": prefix },
        })
      )
    )
  );
  return responses.flatMap((response) => (response.Items ?? []).map(toRecord));
}
