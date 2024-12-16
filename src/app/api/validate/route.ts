import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const { unique_code } = await request.json();

    if (!unique_code) {
      return NextResponse.json(
        { error: "Unique code is required" },
        { status: 400 }
      );
    }

    // Start transaction
    await client.query("BEGIN");

    // Check if code exists and get its status
    const checkResult = await client.query(
      `SELECT uc.id, uc.used, uc.amount, c.name as campaign_name 
       FROM unique_codes uc
       JOIN campaigns c ON c.id = uc.campaign_id
       WHERE uc.unique_code = $1
       FOR UPDATE`, // Lock the row
      [unique_code]
    );

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    }

    const code = checkResult.rows[0];

    if (code.used) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Code has already been used" },
        { status: 400 }
      );
    }

    // Update code to used status
    await client.query(
      `UPDATE unique_codes 
       SET used = true, 
           used_at = CURRENT_TIMESTAMP 
       WHERE unique_code = $1`,
      [unique_code]
    );

    // Commit transaction
    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Code validated successfully",
        data: {
          amount: code.amount,
          campaign_name: code.campaign_name,
          validated_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error validating code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
