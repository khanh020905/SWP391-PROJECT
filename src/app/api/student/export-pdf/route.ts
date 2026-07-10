import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

// Auth helper matching other routes
async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const mockUserId = request.headers.get("x-mock-user-id") || new URL(request.url).searchParams.get("mockUserId");
  
  if (mockUserId) {
    return { id: mockUserId, email: `${mockUserId}@example.com`, user_metadata: { name: "Mock Student" } };
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
    // 1. Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userId = user.id;
    const studentName = user.user_metadata?.name || user.email?.split("@")[0] || "Học viên";
    const studentEmail = user.email || "";

    // 2. Fetch skills from diagnostic_results
    const { data: skillsData } = await supabaseAdmin
      .from('diagnostic_results')
      .select('reading_band, writing_band, listening_band, speaking_band, overall_band')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const skills = skillsData?.[0] || {
      reading_band: 0,
      writing_band: 0,
      listening_band: 0,
      speaking_band: 0,
      overall_band: 0
    };

    // 3. Fetch recent history from student_submissions
    const { data: historyData } = await supabaseAdmin
      .from('student_submissions')
      .select('title, created_at, score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10); // Limit to 10 for clean PDF display

    // 4. Create PDF Document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Load Nunito Fonts (supporting Vietnamese UTF-8 accents)
    const fontsDir = path.join(process.cwd(), "public/assets/fonts");
    const fontRegPath = path.join(fontsDir, "Nunito-Regular.ttf");
    const fontBoldPath = path.join(fontsDir, "Nunito-Bold.ttf");

    if (!fs.existsSync(fontRegPath) || !fs.existsSync(fontBoldPath)) {
      throw new Error("Embedded fonts not found. Please check font assets.");
    }

    const fontRegBytes = fs.readFileSync(fontRegPath);
    const fontBoldBytes = fs.readFileSync(fontBoldPath);

    const fontReg = await pdfDoc.embedFont(fontRegBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);

    // Setup colors
    const forestGreen = rgb(59/255, 92/255, 55/255);   // #3B5C37
    const deepBlue = rgb(15/255, 23/255, 56/255);      // #0F1738
    const softGreen = rgb(238/255, 241/255, 226/255);   // #EEF1E2
    const textGray = rgb(94/255, 103/255, 146/255);    // #5E6792
    const textBlack = rgb(33/255, 37/255, 41/255);
    const goldAccent = rgb(238/255, 154/255, 35/255);  // #EE9A23

    // Add Page
    const page = pdfDoc.addPage([595, 842]); // A4 Size: 595 x 842
    const { width, height } = page.getSize();

    // Draw page borders
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: forestGreen,
      borderWidth: 2,
    });

    // Draw header background band
    page.drawRectangle({
      x: 35,
      y: height - 120,
      width: width - 70,
      height: 80,
      color: softGreen,
    });

    // Header Logo & Branding
    page.drawText("* QualiIelts", {
      x: 50,
      y: height - 85,
      size: 24,
      font: fontBold,
      color: forestGreen,
    });

    page.drawText("BÁO CÁO KẾT QUẢ HỌC TẬP IELTS", {
      x: 50,
      y: height - 108,
      size: 15,
      font: fontBold,
      color: deepBlue,
    });

    // Report Meta (Right Aligned in Header)
    const reportDate = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    
    page.drawText(`Ngày xuất: ${reportDate}`, {
      x: width - 180,
      y: height - 82,
      size: 10,
      font: fontReg,
      color: textGray,
    });

    // Section 1: Student Information
    page.drawText("THÔNG TIN HỌC VIÊN", {
      x: 45,
      y: height - 155,
      size: 12,
      font: fontBold,
      color: forestGreen,
    });

    page.drawRectangle({
      x: 45,
      y: height - 215,
      width: width - 90,
      height: 50,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    page.drawText(`Học viên: `, { x: 60, y: height - 182, size: 10, font: fontBold, color: deepBlue });
    page.drawText(studentName, { x: 120, y: height - 182, size: 10, font: fontReg, color: textBlack });

    page.drawText(`Email: `, { x: 60, y: height - 202, size: 10, font: fontBold, color: deepBlue });
    page.drawText(studentEmail, { x: 120, y: height - 202, size: 10, font: fontReg, color: textBlack });

    // Section 2: Bands Score
    page.drawText("ĐIỂM NĂNG LỰC HIỆN TẠI (DIAGNOSTIC BANDS)", {
      x: 45,
      y: height - 245,
      size: 12,
      font: fontBold,
      color: forestGreen,
    });

    // Overall box (Large)
    page.drawRectangle({
      x: 45,
      y: height - 355,
      width: 140,
      height: 90,
      color: forestGreen,
    });

    page.drawText("OVERALL BAND", {
      x: 65,
      y: height - 290,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    const overallBandText = skills.overall_band ? parseFloat(String(skills.overall_band)).toFixed(1) : "--";
    page.drawText(overallBandText, {
      x: 82,
      y: height - 340,
      size: 38,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Mini Skill Boxes (Reading, Listening, Writing, Speaking)
    const skillsList = [
      { name: "Listening", val: skills.listening_band },
      { name: "Reading", val: skills.reading_band },
      { name: "Writing", val: skills.writing_band },
      { name: "Speaking", val: skills.speaking_band }
    ];

    skillsList.forEach((sk, idx) => {
      const xOffset = 200 + (idx * 85);
      // Box border
      page.drawRectangle({
        x: xOffset,
        y: height - 355,
        width: 75,
        height: 90,
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
      });

      page.drawText(sk.name, {
        x: xOffset + 12,
        y: height - 290,
        size: 10,
        font: fontBold,
        color: textGray,
      });

      const bandValText = sk.val ? parseFloat(String(sk.val)).toFixed(1) : "--";
      page.drawText(bandValText, {
        x: xOffset + 22,
        y: height - 335,
        size: 26,
        font: fontBold,
        color: forestGreen,
      });
    });

    // Section 3: Recent Activity Table
    page.drawText("LỊCH SỬ THI & LUYỆN TẬP GẦN ĐÂY", {
      x: 45,
      y: height - 390,
      size: 12,
      font: fontBold,
      color: forestGreen,
    });

    // Draw Table Header
    const tableY = height - 420;
    
    // Header background
    page.drawRectangle({
      x: 45,
      y: tableY - 20,
      width: width - 90,
      height: 20,
      color: softGreen,
    });

    page.drawText("Tên bài thi / Luyện tập", { x: 55, y: tableY - 14, size: 9, font: fontBold, color: forestGreen });
    page.drawText("Thời gian", { x: 380, y: tableY - 14, size: 9, font: fontBold, color: forestGreen });
    page.drawText("Kết quả", { x: 490, y: tableY - 14, size: 9, font: fontBold, color: forestGreen });

    // Table rows
    let currentY = tableY - 20;
    
    if (!historyData || historyData.length === 0) {
      // Empty state
      currentY -= 30;
      page.drawText("Chưa có lịch sử làm bài thi.", {
        x: 60,
        y: currentY + 10,
        size: 10,
        font: fontReg,
        color: textGray,
      });
      // Bottom border for empty state
      page.drawLine({
        start: { x: 45, y: currentY },
        end: { x: width - 45, y: currentY },
        color: rgb(0.9, 0.9, 0.9),
        thickness: 1,
      });
    } else {
      historyData.forEach((row) => {
        currentY -= 26;
        
        // Row divider
        page.drawLine({
          start: { x: 45, y: currentY },
          end: { x: width - 45, y: currentY },
          color: rgb(0.9, 0.9, 0.9),
          thickness: 1,
        });

        // Format dates beautifully
        const dateStr = new Date(row.created_at).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        // Wrap long titles if necessary
        let shortTitle = row.title || "Luyện tập";
        if (shortTitle.length > 50) {
          shortTitle = shortTitle.substring(0, 47) + "...";
        }

        page.drawText(shortTitle, { x: 55, y: currentY + 7, size: 9.5, font: fontReg, color: textBlack });
        page.drawText(dateStr, { x: 380, y: currentY + 7, size: 9, font: fontReg, color: textGray });
        page.drawText(String(row.score || "--"), { x: 490, y: currentY + 7, size: 10, font: fontBold, color: forestGreen });
      });

      // Bottom border of the table
      page.drawLine({
        start: { x: 45, y: currentY },
        end: { x: width - 45, y: currentY },
        color: rgb(0.9, 0.9, 0.9),
        thickness: 1,
      });
    }

    // Section 4: Study Recommendations
    const recommendY = currentY - 35;
    page.drawText("KHUYẾN NGHỊ HỌC TẬP TỪ AI", {
      x: 45,
      y: recommendY,
      size: 11,
      font: fontBold,
      color: forestGreen,
    });

    // Create a recommendation box
    page.drawRectangle({
      x: 45,
      y: recommendY - 95,
      width: width - 90,
      height: 80,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    // Find weakest skill
    const scoresMap = [
      { name: "Nghe (Listening)", val: skills.listening_band || 0 },
      { name: "Đọc (Reading)", val: skills.reading_band || 0 },
      { name: "Viết (Writing)", val: skills.writing_band || 0 },
      { name: "Nói (Speaking)", val: skills.speaking_band || 0 }
    ];
    
    scoresMap.sort((a, b) => a.val - b.val);
    const weakest = scoresMap[0];
    
    let recommendationText = "Bạn đang có tiến độ học tập rất đồng đều. Hãy duy trì luyện tập hàng ngày nhé!";
    if (weakest && weakest.val > 0 && weakest.val < 7.0) {
      recommendationText = `Kỹ năng ${weakest.name} của bạn đang ở mức thấp nhất (${weakest.val.toFixed(1)}). Hãy tập trung luyện tập thêm các đề`;
    }

    page.drawText(recommendationText, {
      x: 60,
      y: recommendY - 35,
      size: 9.5,
      font: fontReg,
      color: textBlack,
    });

    if (weakest && weakest.val > 0 && weakest.val < 7.0) {
      page.drawText("riêng biệt cho kỹ năng này trên QualiIelts để cải thiện band điểm Overall hiệu quả nhất.", {
        x: 60,
        y: recommendY - 50,
        size: 9.5,
        font: fontReg,
        color: textBlack,
      });
    }

    page.drawText("Chúc bạn sớm hoàn thành mục tiêu band điểm IELTS của mình!", {
      x: 60,
      y: recommendY - 75,
      size: 9.5,
      font: fontBold,
      color: forestGreen,
    });

    // Footer
    page.drawText("QualiIelts — Nền tảng học và luyện thi IELTS hàng đầu", {
      x: (width / 2) - 130,
      y: 40,
      size: 8.5,
      font: fontReg,
      color: textGray,
    });

    // 5. Output PDF bytes
    const pdfBytes = await pdfDoc.save();

    // 6. Return response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Bao_cao_QualiIelts_${studentName}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("❌ Error generating PDF:", error);
    return new NextResponse(
      JSON.stringify({ success: false, message: "Lỗi tạo file PDF.", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
