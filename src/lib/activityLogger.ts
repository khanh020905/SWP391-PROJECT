import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

export interface ActivityLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOCK" | "UNLOCK" | "UPGRADE";
  targetName: string;
  targetEmail: string;
  details: string;
}

// Path to store activity logs JSON file in the project
const LOG_FILE_PATH = path.join(process.cwd(), "src", "lib", "activityLogs.json");

// Helper to ensure the log file and directory exist
function ensureLogFileExists(): void {
  try {
    const dir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOG_FILE_PATH)) {
      fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    }
  } catch {
    // Ignore read-only filesystem error on serverless environments
  }
}

// Read all activity logs from the JSON file
export async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    ensureLogFileExists();
    const fileData = await fs.promises.readFile(LOG_FILE_PATH, "utf-8");
    const logs: ActivityLog[] = JSON.parse(fileData || "[]");
    // Sort by newest first
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Lỗi khi đọc file activity logs:", error);
    return [];
  }
}

// Write a new activity log entry
export async function logActivity(
  action: ActivityLog["action"],
  targetName: string,
  targetEmail: string,
  details: string,
  request?: NextRequest
): Promise<ActivityLog | null> {
  try {
    ensureLogFileExists();

    // Default admin fallbacks
    let adminName = "Admin QualiCode";
    let adminEmail = "admin@qualicode.com";

    // Extract admin info from request headers if available
    if (request) {
      const headerName = request.headers.get("x-admin-name");
      const headerEmail = request.headers.get("x-admin-email");

      if (headerName) {
        try {
          adminName = decodeURIComponent(headerName);
        } catch {
          adminName = headerName;
        }
      }
      if (headerEmail) {
        adminEmail = headerEmail;
      }
    }

    const newLog: ActivityLog = {
      id: "log_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      adminName,
      adminEmail,
      action,
      targetName,
      targetEmail,
      details,
    };

    // Read current logs, append new log, and save back to file
    const fileData = await fs.promises.readFile(LOG_FILE_PATH, "utf-8");
    const logs: ActivityLog[] = JSON.parse(fileData || "[]");
    logs.push(newLog);

    await fs.promises.writeFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
    console.log(`📝 [ActivityLog] ${adminEmail} performed ${action} on ${targetEmail}: ${details}`);
    return newLog;
  } catch (error) {
    console.error("Lỗi khi ghi activity log:", error);
    return null;
  }
}

// Clear all activity logs
export async function clearActivityLogs(): Promise<boolean> {
  try {
    ensureLogFileExists();
    await fs.promises.writeFile(LOG_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    console.log("🧹 [ActivityLog] Đã xóa toàn bộ lịch sử hoạt động.");
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa activity logs:", error);
    return false;
  }
}
