import { getOrders } from "@/lib/sheets";
import { getAnalyticsData } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [orders, analytics] = await Promise.all([
      getOrders(),
      getAnalyticsData(),
    ]);

    // Summary calculations
    let totalRevenue = 0;
    let totalChats = 0;
    let totalOrdersCount = 0;

    analytics.forEach((day) => {
      totalRevenue += day.revenue;
      totalChats += day.total_chat;
      totalOrdersCount += day.total_order;
    });

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];

    const todayData = analytics.find((d) => d.date === today) || {
      date: today,
      total_chat: 0,
      total_order: 0,
      revenue: 0,
    };

    const yesterdayData = analytics.find((d) => d.date === yesterday) || {
      date: yesterday,
      total_chat: 0,
      total_order: 0,
      revenue: 0,
    };

    // Newest orders first
    const sortedOrders = [...orders].reverse();

    return Response.json({
      success: true,
      summary: {
        totalRevenue,
        totalChats,
        totalOrders: totalOrdersCount,
        conversionRate: totalChats > 0 ? (totalOrdersCount / totalChats) * 100 : 0,
        today: todayData,
        yesterday: yesterdayData,
      },
      analytics, // Sorted chronologically (original order in sheet is usually chronological)
      orders: sortedOrders,
    });
  } catch (error: unknown) {
    console.error("[dashboard-api] Error fetching dashboard data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard data";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
