import { pool } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import CodesTable from "./CodesTable";

async function getCampaignWithCodes(
  campaignId: string,
  page: number = 1,
  limit: number = 50,
  filter?: string
) {
  "use server";

  try {
    // Get campaign details
    const campaignResult = await pool.query(
      `SELECT * FROM campaigns WHERE id = $1`,
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      return null;
    }

    const campaign = campaignResult.rows[0];

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query for codes
    let query = `
      SELECT 
        unique_code,
        amount,
        used,
        used_at,
        created_at
      FROM unique_codes
      WHERE campaign_id = $1
    `;

    const queryParams = [campaignId];

    if (filter === "used") {
      query += ` AND used = true`;
    } else if (filter === "unused") {
      query += ` AND used = false`;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM unique_codes WHERE campaign_id = $1`,
      [campaignId]
    );

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    queryParams.push(limit.toString(), offset.toString());

    const codesResult = await pool.query(query, queryParams);

    return {
      campaign,
      codes: codesResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching campaign codes:", error);
    throw error;
  }
}

export default async function CampaignCodesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string; filter?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const filter = searchParams.filter;
  const campaignId = params.id;
  const result = await getCampaignWithCodes(campaignId, page, 50, filter);

  if (!result) {
    notFound();
  }

  const { campaign, codes, total, limit } = result;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold">{campaign.name} - Unique Codes</h1>
        <p className="text-gray-600">Total Codes: {total.toLocaleString()}</p>
      </div>

      <CodesTable
        codes={codes}
        currentPage={page}
        totalPages={totalPages}
        campaignId={campaignId}
        currentFilter={filter}
      />
    </div>
  );
}
