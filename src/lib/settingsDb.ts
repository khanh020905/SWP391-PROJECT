import fs from "fs";
import path from "path";

export interface SystemConfig {
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultUserRole: "GUEST" | "STUDENT" | "ADMIN";
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  sendOnRegister: boolean;
  sendOnPayment: boolean;
  sendOnLock: boolean;
}

export interface BandScoreConfig {
  fluencyWeight: number;
  lexicalWeight: number;
  grammarWeight: number;
  pronunciationWeight: number;
  beginnerMaxBand: number;
  intermediateMaxBand: number;
  advancedMinBand: number;
  beginnerFeedback: string;
  intermediateFeedback: string;
  advancedFeedback: string;
}

export interface SystemSettings {
  system: SystemConfig;
  email: EmailConfig;
  bandScore: BandScoreConfig;
}

const SETTINGS_FILE = path.join(process.cwd(), "src", "lib", "systemSettings.json");

const defaultSettings: SystemSettings = {
  system: {
    appName: "QualiCode IELTS AI",
    supportEmail: "support@qualicode.com",
    maintenanceMode: false,
    allowRegistration: true,
    defaultUserRole: "GUEST",
  },
  email: {
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "notifications@qualicode.com",
    sendOnRegister: true,
    sendOnPayment: true,
    sendOnLock: true,
  },
  bandScore: {
    fluencyWeight: 0.25,
    lexicalWeight: 0.25,
    grammarWeight: 0.25,
    pronunciationWeight: 0.25,
    beginnerMaxBand: 4.5,
    intermediateMaxBand: 6.5,
    advancedMinBand: 7.0,
    beginnerFeedback: "Bạn đang ở cấp độ cơ bản. Hãy tập trung cải thiện phát âm các từ đơn lẻ và mở rộng vốn từ vựng thông dụng cơ bản trước.",
    intermediateFeedback: "Kỹ năng Speaking ở mức khá. Cần tập trung liên kết các ý dài hơn, hạn chế lặp từ và sửa lỗi ngữ pháp thì chia động từ khi nói nhanh.",
    advancedFeedback: "Kỹ năng nói xuất sắc! Hãy tiếp tục duy trì độ trôi chảy, sử dụng thêm các thành ngữ (idiomatic expressions) và các cấu trúc câu phức tạp để đạt band điểm cao hơn nữa.",
  },
};

function ensureSettingsFileExists(): void {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), "utf-8");
    }
  } catch {
    // Ignore read-only filesystem error on serverless environments
  }
}

export async function getSettings(): Promise<SystemSettings> {
  ensureSettingsFileExists();
  try {
    const data = await fs.promises.readFile(SETTINGS_FILE, "utf-8");
    return JSON.parse(data || JSON.stringify(defaultSettings));
  } catch (error) {
    console.error("Lỗi đọc cấu hình hệ thống, sử dụng mặc định:", error);
    return defaultSettings;
  }
}

export async function saveSettings(settings: SystemSettings): Promise<boolean> {
  ensureSettingsFileExists();
  try {
    await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Lỗi khi ghi cấu hình hệ thống:", error);
    return false;
  }
}
