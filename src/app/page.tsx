import { pool } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getCampaigns() {
  "use server";

  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(uc.id) as total_codes,
        COUNT(CASE WHEN uc.used = true THEN 1 END) as used_codes,
        COALESCE(SUM(CASE WHEN uc.used = true THEN uc.amount ELSE 0 END), 0) as current_amount
      FROM campaigns c
      LEFT JOIN unique_codes uc ON c.id = uc.campaign_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    throw error;
  }
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="mx-auto px-4 mt-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold md:text-2xl">Fundraising Campaigns</h1>
        <div className="space-x-1 md:space-x-3">
          <Link
            href="/validate"
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm md:px-4 md:py-2 md:text-base"
          >
            Validate
          </Link>
          <Link
            href="/createcampaign"
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm md:px-4 md:py-2 md:text-base"
          >
            Create
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-2 md:text-xl">
                {campaign.name}
              </h2>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (campaign.current_amount / campaign.target_amount) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {(
                      (campaign.current_amount / campaign.target_amount) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>

                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Raised</span>
                  <span className="font-medium">
                    ${Number(campaign.current_amount).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Target</span>
                  <span className="font-medium">
                    ${Number(campaign.target_amount).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Codes Used</span>
                  <span className="font-medium">
                    {campaign.used_codes} / {campaign.total_codes}
                  </span>
                </div>

                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">
                    {format(new Date(campaign.start_date), "MMM d, yyyy")} -{" "}
                    {campaign.end_date
                      ? format(new Date(campaign.end_date), "MMM d, yyyy")
                      : "Ongoing"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium md:text-base"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 md:text-xl">
              No campaigns yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 md:text-base">
              Get started by creating a new campaign.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
