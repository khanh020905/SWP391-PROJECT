import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Function to read .env file manually to avoid dependency issues
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ File .env không tồn tại. Vui lòng tạo file .env trước.");
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, "utf-8");
  const env = {};
  
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      // Remove surrounding quotes if any
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value.trim();
    }
  });
  
  return env;
}

async function run() {
  const env = loadEnv();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env");
    process.exit(1);
  }
  
  console.log(`🌐 Đang kết nối tới Supabase: ${supabaseUrl}...`);
  
  // Khởi tạo Supabase client với Service Role Key để có quyền Admin
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  const adminEmail = "admin@qualicode.com";
  const adminPassword = "admin123";
  const adminMetadata = {
    name: "Admin QualiCode",
    role: "ADMIN",
    isLocked: false
  };
  
  try {
    console.log("🔍 Đang kiểm tra xem tài khoản admin đã tồn tại chưa...");
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }
    
    const existingAdmin = users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
    
    if (existingAdmin) {
      console.log(`⚠️ Tài khoản ${adminEmail} đã tồn tại (ID: ${existingAdmin.id}). Đang cập nhật thông tin thành ADMIN...`);
      
      const { data: { user }, error: updateError } = await supabase.auth.admin.updateUserById(existingAdmin.id, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: adminMetadata,
        ban_duration: "none" // Đảm bảo tài khoản không bị khóa
      });
      
      if (updateError) throw updateError;
      
      console.log("✅ Cập nhật tài khoản Admin thành công!");
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Mật khẩu mới: ${adminPassword}`);
      console.log(`👤 Metadata:`, user.user_metadata);
    } else {
      console.log(`🌱 Tài khoản ${adminEmail} chưa tồn tại. Đang tạo mới...`);
      
      const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: adminMetadata
      });
      
      if (createError) throw createError;
      
      console.log("✅ Tạo tài khoản Admin mới thành công!");
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Mật khẩu: ${adminPassword}`);
      console.log(`👤 Metadata:`, user.user_metadata);
    }
    
  } catch (error) {
    console.error("❌ Đã xảy ra lỗi:", error.message || error);
    process.exit(1);
  }
}

run();
