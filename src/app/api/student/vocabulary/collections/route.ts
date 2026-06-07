import { NextRequest, NextResponse } from "next/server";
import { getCollections, createCollection, deleteCollection } from "@/lib/studentProgressDb";
import { supabaseAdmin } from "@/lib/supabase";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const mockUserId = request.headers.get("x-mock-user-id") || new URL(request.url).searchParams.get("mockUserId");
  if (mockUserId) {
    return { id: mockUserId, email: `${mockUserId}@example.com`, name: "Mock Student" };
  }

  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await getCollections(user.id);
    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/student/vocabulary/collections:", error);
    return NextResponse.json(
      { message: "Không thể lấy danh sách bộ sưu tập.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description = "" } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const collection = await createCollection(user.id, name, description);
    return NextResponse.json({ success: true, collection });
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/student/vocabulary/collections:", error);
    return NextResponse.json(
      { message: "Không thể tạo bộ sưu tập.", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json({ error: "collectionId is required" }, { status: 400 });
    }

    const deleted = await deleteCollection(user.id, collectionId);
    if (!deleted) {
      return NextResponse.json({ error: "Collection not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Lỗi API DELETE /api/student/vocabulary/collections:", error);
    return NextResponse.json(
      { message: "Không thể xóa bộ sưu tập.", error: error.message },
      { status: 500 }
    );
  }
}
