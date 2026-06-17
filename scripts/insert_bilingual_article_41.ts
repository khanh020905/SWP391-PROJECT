import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim();
        process.env[key] = val;
      }
    });
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kaoybbpezkkmufzbhxru.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb3liYnBlemtrbXVmemJoeHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2Nzc5NSwiZXhwIjoyMDk0ODQzNzk1fQ.7VT1X4qttHogRpiJoKNxjFJ5cMUAqmQyg4m_7wxk3F8";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const content = [
  {
    en: "The article explores how the decline of children playing freely in residential streets has reshaped both childhood and adult life in modern cities. It begins with an experiment in Bristol, England, where two mothers temporarily closed their street to traffic so children could play outside without [structured]{có cấu trúc/định sẵn} activities or parental [scheduling]{lên lịch trình}. The results showed that children quickly created their own games and interactions, while adults in the neighborhood [unexpectedly]{một cách bất ngờ} began forming stronger social connections with one another.",
    vi: "Bài viết khám phá cách sự suy giảm của việc trẻ em chơi đùa tự do trên các đường phố dân cư đã tái định hình cả thời thơ ấu và cuộc sống của người trưởng thành ở các thành phố hiện đại. Nó bắt đầu với một thí nghiệm ở Bristol, Anh, nơi hai người mẹ đã tạm thời đóng cửa đường phố của họ để cấm phương tiện giao thông, nhờ đó trẻ em có thể chơi đùa ngoài trời mà không cần các hoạt động có cấu trúc hay sự lên lịch trình của cha mẹ. Kết quả cho thấy trẻ em nhanh chóng tạo ra các trò chơi và sự tương tác của riêng chúng, trong khi người lớn trong khu phố bắt đầu hình thành các mối kết nối xã hội mạnh mẽ hơn với nhau một cách đầy bất ngờ."
  },
  {
    en: "A key argument is that the rise of [car-centered]{lấy ô tô làm trung tâm} urban design has fundamentally changed the function of streets. Historically, streets were shared social spaces where children played, adults interacted, and informal community life [unfolded]{đã diễn ra/mở ra} naturally. However, as automobile traffic increased, streets became [prioritized]{được ưu tiên} for transportation, pushing children’s play into controlled environments like playgrounds and structured activities. This shift also increased the [logistical]{(thuộc) hậu cần} burden on parents, who now often have to organize and supervise children’s leisure time.",
    vi: "Một lập luận chính là sự gia tăng của thiết kế đô thị lấy ô tô làm trung tâm đã thay đổi cơ bản chức năng của đường phố. Trong lịch sử, đường phố là không gian xã hội chung nơi trẻ em chơi đùa, người lớn tương tác và đời sống cộng đồng thân mật diễn ra một cách tự nhiên. Tuy nhiên, khi lưu lượng giao thông ô tô tăng lên, đường phố được ưu tiên cho giao thông vận tải, đẩy các hoạt động chơi đùa của trẻ em vào các môi trường được kiểm soát như sân chơi và các hoạt động có cấu trúc. Sự chuyển dịch này cũng làm tăng gánh nặng hậu cần lên các bậc cha mẹ, những người hiện nay thường phải tổ chức và giám sát thời gian rảnh rỗi của con cái."
  },
  {
    en: "The article highlights research and expert commentary suggesting that removing children from streets has had [unintended]{ngoài ý muốn/không chủ ý} social consequences for adults as well. When children play in shared outdoor spaces, they act as “[connective tissue]{mô liên kết}” within communities, encouraging neighbors to interact more frequently and casually. Even brief or [superficial]{hời hợt/nông/bề ngoài} interactions between adults can build [familiarity]{sự quen thuộc} and reduce social isolation over time.",
    vi: "Bài viết nêu bật nghiên cứu và bình luận của chuyên gia gợi ý rằng việc đưa trẻ em ra khỏi đường phố cũng đã gây ra những hậu quả xã hội ngoài ý muốn cho cả người lớn. Khi trẻ em chơi đùa trong các không gian ngoài trời chung, chúng đóng vai trò như \"mô liên kết\" trong cộng đồng, khuyến khích những người hàng xóm tương tác thường xuyên và giản dị hơn. Ngay cả những tương tác ngắn ngủi hoặc mang tính bề ngoài giữa những người lớn cũng có thể xây dựng sự quen thuộc và giảm bớt sự cô lập xã hội theo thời gian."
  },
  {
    en: "It also discusses how play streets—temporary street closures that allow children to play freely—can [revive]{hồi sinh/làm sống lại} some of these lost dynamics. In many cases, these [initiatives]{các sáng kiến} lead not only to more independent play among children but also to increased trust and social [cohesion]{sự gắn kết/liên kết} among adults. However, the article notes that such programs require significant coordination and are not always [sustainable]{bền vững}, especially in high-traffic areas or communities with limited resources.",
    vi: "Nó cũng thảo luận về cách các tuyến phố vui chơi — việc tạm đóng cửa đường phố để trẻ em chơi đùa tự do — có thể hồi sinh một số động lực đã mất này. Trong nhiều trường hợp, các sáng kiến này không chỉ dẫn đến việc trẻ em chơi đùa độc lập hơn mà còn giúp tăng cường sự tin tưởng và gắn kết xã hội giữa người lớn. Tuy nhiên, bài viết lưu ý rằng các chương trình như vậy đòi hỏi sự phối hợp đáng kể và không phải lúc nào cũng bền vững, đặc biệt là ở các khu vực có mật độ giao thông cao hoặc các cộng đồng có nguồn lực hạn chế."
  },
  {
    en: "Ultimately, the piece argues that the decline of street play reflects broader changes in urban design and social organization. It suggests that [restoring]{sự khôi phục/phục hồi} children’s freedom to play outdoors would not only benefit child development but also strengthen community [ties]{các mối liên kết/quan hệ} and improve adult well-being, highlighting how children’s play has historically played an important social role far [beyond]{vượt ra ngoài} childhood itself.",
    vi: "Cuối cùng, tác phẩm lập luận rằng sự suy giảm của trò chơi đường phố phản ánh những thay đổi rộng lớn hơn trong thiết kế đô thị và tổ chức xã hội. Nó gợi ý rằng việc khôi phục quyền tự do chơi đùa ngoài trời của trẻ em không chỉ có lợi cho sự phát triển của trẻ mà còn tăng cường mối liên kết cộng đồng và cải thiện thể trạng khỏe mạnh của người lớn, làm nổi bật cách trò chơi của trẻ em trong lịch sử đã đóng một vai trò xã hội quan trọng vượt xa bản thân thời thơ ấu."
  }
];

async function main() {
  console.log("Inserting bilingual article 41 (What Adults Lost When Kids Stopped Playing)...");

  const { data, error } = await supabaseAdmin
    .from("bilingual_articles")
    .insert({
      source_id: "the-atlantic",
      source_url: "https://www.theatlantic.com/family/archive/2024/07/street-play-benefits-adults-communities/679237",
      source_label: "The Atlantic",
      title: "What Adults Lost When Kids Stopped Playing in the Street",
      title_vi: "Những gì người lớn đánh mất khi trẻ em không còn chơi đùa trên đường phố",
      category: "Family",
      category_vi: "Gia đình",
      excerpt: "The article explores how the decline of children playing freely in residential streets has reshaped childhood and adult life.",
      excerpt_vi: "Bài viết khám phá cách sự suy giảm của việc trẻ em chơi đùa tự do trên đường phố dân cư đã tái định hình cả trẻ thơ lẫn đời sống người lớn.",
      author: "Stephanie H. Murray",
      read_time: "4 mins",
      image_url: "https://images.unsplash.com/photo-1472162072142-d544e77ade5e?auto=format&fit=crop&w=1200&q=80",
      content: content
    })
    .select();

  if (error) {
    console.error("Error inserting article:", error);
    process.exit(1);
  }

  console.log("Success! Inserted article 41:", data?.[0]?.id);
}

main().catch(console.error);
