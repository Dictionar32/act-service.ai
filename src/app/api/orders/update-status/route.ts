import { updateOrderStatus } from "@/lib/sheets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rowNumber, status } = body;

    if (rowNumber === undefined || !status) {
      return Response.json(
        { success: false, error: "rowNumber and status are required" },
        { status: 400 }
      );
    }

    const parsedRowNumber = Number(rowNumber);
    if (isNaN(parsedRowNumber)) {
      return Response.json(
        { success: false, error: "rowNumber must be a valid number" },
        { status: 400 }
      );
    }

    const success = await updateOrderStatus(parsedRowNumber, status);
    if (success) {
      return Response.json({ success: true });
    } else {
      return Response.json(
        { success: false, error: `Order row #${rowNumber} not found` },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error("[update-status-api] Error updating order status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update order status";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
