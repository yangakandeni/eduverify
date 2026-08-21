import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { FacultyProgrammes, InstitutionRecord } from "./types";

const TABLE_NAME = process.env.EDUVERIFY_TABLE_NAME ?? "eduverify-institutions";
const REGION = process.env.AWS_REGION ?? "af-south-1";
const REQUEST_TIMEOUT_MS = 2500;

/** GSI1PK values written by eduverify-api's ingestion pipeline (institution.status, uppercased,
 * or UNKNOWN). The last two are the public-university/TVET status strings, uppercased the same
 * way — they must stay listed here or GSI1-based queries (this file's own
 * queryByNamePrefix, plus eduverify-api's search/list) silently never see those institutions,
 * even though a direct GetItem by PK still finds them. */
const STATUS_PARTITIONS = [
  "REGISTERED",
  "PROVISIONALLY REGISTERED",
  "UNKNOWN",
  "ESTABLISHED — HIGHER EDUCATION ACT",
  "ESTABLISHED — CONTINUING EDUCATION AND TRAINING ACT",
  "CANCELLED",
  "DISCONTINUED",
  "BOGUS",
];

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

/** DynamoDB is seeded by eduverify-api's ingestion pipeline: private DHET register data spreads
 * institutions.json-shaped records as-is (never carrying an institutionType field), plus public
 * universities/TVET colleges (which do carry one) — so items carry faculties_and_programmes
 * directly once the equivalent of this repo's `npm run bake:faculties` step has enriched the
 * data before seeding — no further parsing needed here. Defaults faculties_and_programmes to []
 * for any item that bypassed that bake step and won't have the field yet, and strips a stale raw
 * `qualifications` key if one is still present on such a legacy item. Defaults institutionType to
 * "Private Higher Education Institution" only when
 * the item itself doesn't carry one — true for every private-register item, never true for a
 * seeded public university/TVET college. */
export function toRecord(item: Record<string, unknown>): InstitutionRecord {
  const record = { ...item };
  const id = record.PK as string;
  const institutionType =
    (record.institutionType as InstitutionRecord["institutionType"] | undefined) ??
    "Private Higher Education Institution";
  const facultiesAndProgrammes = (record.faculties_and_programmes as FacultyProgrammes[] | undefined) ?? [];
  delete record.PK;
  delete record.GSI1PK;
  delete record.GSI1SK;
  delete record.institutionType;
  delete record.faculties_and_programmes;
  delete record.qualifications;
  return {
    ...(record as Omit<InstitutionRecord, "id" | "faculties_and_programmes" | "institutionType">),
    id,
    institutionType,
    faculties_and_programmes: facultiesAndProgrammes,
  };
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
