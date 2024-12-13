import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM unique_codes ORDER BY created_at DESC"
    );
    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

interface CampaignRequest {
  name: string;
  startDate: string;
  endDate: string;
  targetAmount: number;
  codeAmount: number;
  maxCodes: number;
}

export async function POST(request: Request) {
  try {
    const {
      name,
      startDate,
      endDate,
      targetAmount,
      codeAmount,
      maxCodes,
    }: CampaignRequest = await request.json();

    // Validate inputs
    if (!name || !startDate || !targetAmount || !codeAmount || !maxCodes) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (maxCodes > 25000) {
      return new Response("Max codes cannot exceed 25000", { status: 400 });
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create the campaign
      const campaignResult = await client.query(
        `INSERT INTO campaigns 
         (name, start_date, end_date, target_amount, current_amount, max_codes) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [name, startDate, endDate, targetAmount, 0, maxCodes]
      );

      const campaignId = campaignResult.rows[0].id;

      // Generate unique codes for the campaign
      const codes = [];
      for (let i = 0; i < maxCodes; i++) {
        let uniqueCode;
        do {
          uniqueCode = Math.floor(
            100000000000 + Math.random() * 900000000000
          ).toString();
        } while (await checkUniqueCodeExists(uniqueCode, campaignId));

        codes.push({
          campaign_id: campaignId,
          unique_code: uniqueCode,
          amount: codeAmount,
          used: false,
        });
      }

      // Insert all codes
      await client.query(
        `INSERT INTO unique_codes 
         (campaign_id, unique_code, amount, used)
         SELECT 
           (data->>'campaign_id')::integer,
           data->>'unique_code',
           (data->>'amount')::numeric,
           (data->>'used')::boolean
         FROM jsonb_array_elements($1::jsonb) AS data`,
        [JSON.stringify(codes)]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          data: {
            campaignId,
            name,
            codesGenerated: codes.length,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Transaction error:", error);
      return new Response("Error creating campaign and generating codes", {
        status: 500,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Failed to create campaign and generate codes." },
      { status: 500 }
    );
  }
}

async function checkUniqueCodeExists(uniqueCode: string, campaignId: number) {
  const result = await pool.query(
    "SELECT 1 FROM unique_codes WHERE unique_code = $1 AND campaign_id = $2",
    [uniqueCode, campaignId]
  );
  return result.rows.length > 0;
}
