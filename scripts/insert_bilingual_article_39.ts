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

const articlesToInsert = [
  {
    source_id: "the-new-york-times",
    source_url: "https://www.nytimes.com/2026/05/17/us/jeffrey-epstein-unresolved-questions-nyt",
    source_label: "The New York Times",
    title: "The Big Questions About Jeffrey Epstein: What The Times Has Learned",
    title_vi: "Những câu hỏi lớn về Jeffrey Epstein: Tờ Times đã tìm hiểu được gì",
    category: "Investigative",
    category_vi: "Điều tra",
    excerpt: "The article lays out the major unresolved questions surrounding Jeffrey Epstein’s life, criminal network, and institutional failures.",
    excerpt_vi: "Bài báo trình bày những câu hỏi lớn chưa được giải quyết xoay quanh cuộc đời của Jeffrey Epstein, mạng lưới tội phạm và các thất bại mang tính hệ thống.",
    author: "Vimal Patel, Matthew Goldstein, Jeffrey Gettleman",
    read_time: "5 mins",
    image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        en: "The article lays out the major [unresolved]{chưa được giải quyết} questions surrounding Jeffrey Epstein’s life, criminal network, and the [institutional]{thuộc về thể chế} failures that allowed him to operate for years despite earlier legal action. It draws on years of investigative reporting, court records, and newly [surfaced]{nổi lên/xuất hiện} documents to examine how Epstein, a wealthy financier with extensive connections across politics, academia, and business, was able to maintain access to powerful individuals even after his 2008 conviction for soliciting prostitution from a minor. The reporting emphasizes that the controversial plea deal he received in Florida effectively [shielded]{che chở/bảo vệ} him from more serious federal charges, limiting scrutiny of the broader scope of his alleged trafficking network.",
        vi: "Bài báo trình bày những câu hỏi lớn chưa được giải quyết xoay quanh cuộc đời của Jeffrey Epstein, mạng lưới tội phạm của ông ta, và những thất bại mang tính hệ thống/thể chế đã cho phép ông ta hoạt động trong nhiều năm bất chấp các hành động pháp lý trước đó. Nó dựa trên nhiều năm đưa tin điều tra, hồ sơ tòa án và các tài liệu mới xuất hiện để xem xét cách Epstein, một nhà tài chính giàu có với các mối quan hệ sâu rộng trong giới chính trị, học thuật và kinh doanh, có thể duy trì quyền tiếp cận với những cá nhân quyền lực ngay cả sau bản án năm 2008 vì hành vi gạ gẫm mại dâm trẻ vị thành niên. Báo cáo nhấn mạnh rằng thỏa thuận nhận tội gây tranh cãi mà ông ta nhận được ở Florida đã bảo vệ ông ta một cách hiệu quả khỏi các cáo buộc liên bang nghiêm trọng hơn, hạn chế sự giám sát đối với phạm vi rộng lớn hơn của mạng lưới buôn người bị cáo buộc của ông ta."
      },
      {
        en: "A central focus of the article is the scale and structure of Epstein’s social and professional connections. The Times highlights how Epstein [cultivated]{trau dồi/xây dựng} relationships with influential figures in finance, politics, science, and royalty, often presenting himself as a philanthropist and intellectual [benefactor]{nhà hảo tâm/ân nhân}. These relationships continued even after his conviction, raising questions about why so many institutions and individuals remained willing to [engage]{tương tác/liên kết} with him despite public allegations. The article underscores that while many associations are documented through emails, flight logs, and financial records, the full extent of what Epstein shared with or [concealed]{che giấu} from his associates remains unclear.",
        vi: "Trọng tâm chính của bài báo là quy mô và cấu trúc của các mối quan hệ xã hội và nghề nghiệp của Epstein. Tờ Times nêu bật cách Epstein xây dựng mối quan hệ với các nhân vật có ảnh hưởng trong tài chính, chính trị, khoa học và hoàng gia, thường thể hiện mình là một nhà từ thiện và ân nhân trí thức. Những mối quan hệ này vẫn tiếp tục ngay cả sau khi ông ta bị kết án, đặt ra câu hỏi tại sao rất nhiều tổ chức và cá nhân vẫn sẵn lòng tương tác với ông ta bất chấp những cáo buộc công khai. Bài báo nhấn mạnh rằng mặc dù nhiều mối liên kết được ghi lại qua email, nhật ký chuyến bay và hồ sơ tài chính, nhưng mức độ đầy đủ của những gì Epstein chia sẻ hoặc che giấu với các cộng sự của mình vẫn chưa rõ ràng."
      },
      {
        en: "The article also examines the role of Ghislaine Maxwell, Epstein’s longtime associate, who was later convicted for helping [recruit]{tuyển dụng/chiêu mộ} and [facilitate]{tạo điều kiện} abuse of underage girls. Her trial and conviction provided important insights into how Epstein’s operation functioned, but the article notes that many aspects of the broader network—particularly the involvement or awareness of other powerful individuals—remain unresolved. Survivors’ accounts and legal [filings]{hồ sơ pháp lý} continue to raise questions about accountability and [complicity]{sự đồng lõa} beyond Epstein and Maxwell themselves.",
        vi: "Bài viết cũng xem xét vai trò của Ghislaine Maxwell, cộng sự lâu năm của Epstein, người sau đó đã bị kết án vì tội giúp chiêu mộ và tạo điều kiện cho việc lạm dụng các cô gái vị thành niên. Phiên tòa và phán quyết dành cho bà ta đã cung cấp những thông tin quan trọng về cách thức hoạt động của đường dây Epstein, nhưng bài báo lưu ý rằng nhiều khía cạnh của mạng lưới rộng lớn hơn — đặc biệt là sự tham gia hoặc nhận thức của các cá nhân quyền lực khác — vẫn chưa được giải quyết. Lời kể của những người sống sót và các hồ sơ pháp lý tiếp tục đặt ra câu hỏi về trách nhiệm giải trình và sự đồng lõa vượt ra ngoài bản thân Epstein và Maxwell."
      },
      {
        en: "Another major theme is Epstein’s 2019 death in federal custody, officially ruled a suicide, which has remained the subject of public [skepticism]{sự hoài nghi} and conspiracy theories. The article acknowledges documented failures in jail procedures, including security [lapses]{sự sai sót/lỗi} and broken [surveillance]{sự giám sát} systems, but states that no [verified]{đã được xác minh} evidence has emerged supporting claims of murder. Nevertheless, the circumstances of his death have intensified public scrutiny of the institutions responsible for his detention and the broader handling of his case.",
        vi: "Một chủ đề lớn khác là cái chết năm 2019 của Epstein trong trại giam liên bang, được phán quyết chính thức là một vụ tự tử, vốn vẫn là chủ đề của sự hoài nghi công chúng và các thuyết âm mưu. Bài viết thừa nhận những thất bại đã được ghi nhận trong quy trình của nhà tù, bao gồm các lỗ hổng an ninh và hệ thống giám sát bị hỏng, nhưng tuyên bố rằng không có bằng chứng được xác minh nào nổi lên hỗ trợ cho các tuyên bố về vụ giết người. Tuy nhiên, các tình huống xung quanh cái chết của ông ta đã làm tăng cường sự giám sát của công chúng đối với các tổ chức chịu trách nhiệm giam giữ ông ta và cách xử lý rộng hơn đối với vụ án của ông ta."
      },
      {
        en: "Ultimately, the piece frames the Epstein case as an [enduring]{kéo dài/dai dẳng} scandal defined not only by his crimes but also by [systemic]{mang tính hệ thống} breakdowns in legal enforcement, elite social networks, and institutional [accountability]{trách nhiệm giải trình}. Despite extensive investigations and document releases, significant questions remain about the full scope of his activities and the extent to which others may have [enabled]{cho phép/tạo điều kiện} or ignored them.",
        vi: "Cuối cùng, bài viết định khung vụ án Epstein như một vụ bê bối dai dẳng được định nghĩa không chỉ bởi các tội ác của ông ta mà còn bởi những sự sụp đổ mang tính hệ thống trong việc thực thi pháp luật, các mạng lưới xã hội tinh hoa và trách nhiệm giải trình của các tổ chức. Bất chấp các cuộc điều tra sâu rộng và việc công bố tài liệu, những câu hỏi quan trọng vẫn còn đó về toàn bộ phạm vi hoạt động của ông ta và mức độ mà những người khác có thể đã dung túng hoặc phớt lờ chúng."
      }
    ]
  },
  {
    source_id: "the-new-york-times",
    source_url: "https://www.nytimes.com/2026/06/16/us/politics/republicans-georgia-senate-runoff-ossoff-collins",
    source_label: "The New York Times",
    title: "Republicans pick Senate challenger for Jon Ossoff; Georgia runoff results reshape 2026 map",
    title_vi: "Đảng Cộng hòa chọn đối thủ Thượng viện tranh tài với Jon Ossoff; kết quả vòng hai ở Georgia tái định hình bản đồ năm 2026",
    category: "Politics",
    category_vi: "Chính trị",
    excerpt: "The article covers the results of key Republican primary runoffs in Georgia and Alabama, reshaping the 2026 midterm map.",
    excerpt_vi: "Bài viết đưa tin về kết quả các cuộc bầu cử vòng hai của Đảng Cộng hòa ở Georgia và Alabama, định hình lại bản đồ bầu cử giữa nhiệm kỳ 2026.",
    author: "Shane Goldmacher, Nick Corasaniti",
    read_time: "4 mins",
    image_url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        en: "The article covers the results of key Republican primary [runoffs]{các cuộc bầu cử chung cuộc/bầu cử vòng hai} in Georgia and Alabama, where voters selected candidates who will compete in the 2026 [midterm]{giữa nhiệm kỳ} elections, with particular attention on the upcoming U.S. Senate race against Democratic [incumbent]{người đương nhiệm} Jon Ossoff in Georgia. In Georgia’s Senate runoff, Republican voters chose U.S. Representative Mike Collins as their nominee, setting up a high-profile general election battle with Ossoff in a state widely seen as one of the most competitive political battlegrounds in the country.",
        vi: "Bài báo đưa tin về kết quả của các cuộc bầu cử sơ bộ vòng hai quan trọng của Đảng Cộng hòa ở Georgia và Alabama, nơi các cử tri đã chọn ra những ứng cử viên sẽ tranh cử trong cuộc bầu cử giữa nhiệm kỳ năm 2026, với sự chú ý đặc biệt dành cho cuộc đua vào Thượng viện Hoa Kỳ sắp tới chống lại nghị sĩ đương nhiệm của Đảng Dân chủ Jon Ossoff ở Georgia. Trong cuộc bầu cử vòng hai của Thượng viện Georgia, các cử tri Đảng Cộng hòa đã chọn Dân biểu Hoa Kỳ Mike Collins làm ứng cử viên đại diện của họ, thiết lập một cuộc chiến tổng tuyển cử thu hút nhiều sự chú ý với Ossoff tại một bang được nhiều người coi là một trong những chiến trường chính trị cạnh tranh nhất cả nước."
      },
      {
        en: "Collins, a Trump-backed conservative congressman, defeated former football coach Derek Dooley in the runoff, [solidifying]{củng cố} the influence of Donald Trump within the state’s Republican [electorate]{cử tri/toàn bộ cử tri}. The article notes that Collins has aligned himself closely with Trump’s political agenda and messaging, including [hardline]{cứng rắn} positions on immigration, election integrity, and federal government [oversight]{sự giám sát}. His nomination signals that the Georgia Senate race is likely to be heavily nationalized, with both parties investing significant resources due to its potential impact on Senate control.",
        vi: "Collins, một nghị sĩ bảo thủ được Trump hậu thuẫn, đã đánh bại cựu huấn luyện viên bóng bầu dục Derek Dooley trong cuộc bầu cử vòng hai, củng cố tầm ảnh hưởng của Donald Trump đối với cử tri Đảng Cộng hòa của bang. Bài báo lưu ý rằng Collins đã liên kết chặt chẽ bản thân với chương trình nghị sự chính trị và thông điệp của Trump, bao gồm các lập trường cứng rắn về nhập cư, tính liêm chính của bầu cử và sự giám sát của chính phủ liên bang. Sự đề cử của ông báo hiệu rằng cuộc đua Thượng viện Georgia có khả năng sẽ bị quốc gia hóa mạnh mẽ, với việc cả hai đảng đầu tư nguồn lực đáng kể do tác động tiềm tàng của nó đối với quyền kiểm soát Thượng viện."
      },
      {
        en: "In addition to the Senate race, the article highlights the Republican [gubernatorial]{(thuộc) thống đốc} runoff in Georgia, where billionaire healthcare executive Rick Jackson defeated Trump-endorsed Lieutenant Governor Burt Jones. Jackson’s victory is described as a notable political [upset]{sự bất ngờ/lật đổ bất ngờ}, as he overcame both establishment backing and Trump’s endorsement through a heavily [self-funded]{tự tài trợ} campaign. His win illustrates that while Trump remains influential, well-funded outsider candidates can still break through in GOP primaries under certain conditions.",
        vi: "Ngoài cuộc đua Thượng viện, bài báo cũng nêu bật cuộc bầu cử vòng hai chức thống đốc của Đảng Cộng hòa ở Georgia, nơi giám đốc điều hành chăm sóc sức khỏe tỷ phú Rick Jackson đã đánh bại Phó Thống đốc Burt Jones được Trump ủng hộ. Chiến thắng của Jackson được mô tả là một bất ngờ chính trị đáng chú ý, khi ông vượt qua cả sự ủng hộ của giới tinh hoa truyền thống lẫn sự chứng thực của Trump thông qua một chiến dịch tranh cử tự tài trợ rất lớn. Chiến thắng của ông minh họa rằng mặc dù Trump vẫn có tầm ảnh hưởng, các ứng cử viên bên ngoài được tài trợ tốt vẫn có thể bứt phá trong các cuộc bầu cử sơ bộ của Đảng Cộng hòa (GOP) dưới những điều kiện nhất định."
      },
      {
        en: "The broader [takeaway]{bài học/điều rút ra} from the article is that the 2026 primary season is revealing internal [tensions]{sự căng thẳng} within the Republican Party between Trump-aligned candidates, traditional conservatives, and wealthy political newcomers. While Trump continues to shape candidate selection in many races, the [mixed]{trái chiều/lẫn lộn} outcomes in Georgia suggest his influence is not absolute, particularly when candidates with strong financial backing or local political dynamics come into play.",
        vi: "Điều rút ra rộng hơn từ bài báo là mùa bầu cử sơ bộ năm 2026 đang tiết lộ những căng thẳng nội bộ trong Đảng Cộng hòa giữa các ứng cử viên liên kết với Trump, những người bảo thủ truyền thống và những người mới tham gia chính trường giàu có. Trong khi Trump tiếp tục định hình việc lựa chọn ứng cử viên trong nhiều cuộc đua, các kết quả trái chiều ở Georgia cho thấy ảnh hưởng của ông không phải là tuyệt đối, đặc biệt là khi các ứng cử viên có nguồn tài trợ tài chính mạnh mẽ hoặc động lực chính trị địa phương tham gia."
      },
      {
        en: "Overall, the article frames the Georgia and Alabama runoffs as early [indicators]{chỉ báo/dấu hiệu} of the national political landscape heading into the 2026 midterm elections, with Georgia [emerging]{nổi lên} once again as a central battleground that could help determine control of the U.S. Senate.",
        vi: "Nhìn chung, bài viết định khung cuộc bầu cử vòng hai ở Georgia và Alabama như những dấu hiệu sớm của bối cảnh chính trị quốc gia hướng tới cuộc bầu cử giữa nhiệm kỳ năm 2026, với Georgia một lần nữa nổi lên như một chiến trường trung tâm có thể giúp quyết định quyền kiểm soát Thượng viện Hoa Kỳ."
      }
    ]
  },
  {
    source_id: "the-new-york-times",
    source_url: "https://www.nytimes.com/2026/06/16/us/minnesota-antifa-immigration-charges-federal-scrutiny",
    source_label: "The New York Times",
    title: "Minnesota immigration charges linked to alleged Antifa activity draw federal scrutiny",
    title_vi: "Các cáo buộc di trú ở Minnesota liên quan đến hoạt động bị nghi là của Antifa thu hút sự giám sát của liên bang",
    category: "U.S. News",
    category_vi: "Tin tức Hoa Kỳ",
    excerpt: "Federal charges in Minnesota against individuals linked to alleged Antifa activity targeting immigration facilities draw scrutiny.",
    excerpt_vi: "Các cáo buộc liên bang tại Minnesota chống lại các cá nhân liên quan đến hoạt động Antifa nhắm vào các cơ sở di trú thu hút sự giám sát.",
    author: "Ken Bensinger, Maggie Haberman",
    read_time: "4 mins",
    image_url: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        en: "The article reports on federal charges filed in Minnesota against several individuals accused of [involvement]{sự tham gia/liên quan} in violent incidents connected to what authorities describe as an “Antifa-linked network.” According to prosecutors, the defendants are alleged to have participated in [coordinated]{được phối hợp} actions targeting immigration enforcement facilities and local law enforcement officers, raising concerns about politically motivated violence and the growing use of [decentralized]{phi tập trung} activist networks.",
        vi: "Bài báo đưa tin về các cáo buộc liên bang được đưa ra ở Minnesota đối với một số cá nhân bị buộc tội liên quan đến các vụ bạo lực kết nối với những gì nhà chức trách mô tả là \"mạng lưới liên kết với Antifa\". Theo các công tố viên, các bị cáo bị buộc tội đã tham gia vào các hành động phối hợp nhằm vào các cơ sở thực thi luật di trú và các sĩ quan thực thi pháp luật địa phương, dấy lên lo ngại về bạo lực có động cơ chính trị và việc sử dụng ngày càng nhiều các mạng lưới hoạt động phi tập trung."
      },
      {
        en: "Federal officials argue that the case is part of a broader investigation into [extremist]{cực đoan} activity that blends online organizing with [localized]{mang tính cục bộ/địa phương} protest actions. The charges include allegations of conspiracy, [obstruction]{sự cản trở} of federal operations, and assault on law enforcement personnel. Authorities say evidence includes encrypted communications, surveillance footage, and seized electronic devices that allegedly show coordination before and after the incidents.",
        vi: "Các quan chức liên bang lập luận rằng vụ án này là một phần của cuộc điều tra rộng hơn về hoạt động cực đoan kết hợp giữa việc tổ chức trực tuyến với các hành động phản đối mang tính cục bộ. Các cáo buộc bao gồm cáo buộc âm mưu, cản trở các hoạt động liên bang và tấn công nhân viên thực thi pháp luật. Nhà chức trách cho biết bằng chứng bao gồm các thông tin liên lạc được mã hóa, cảnh quay giám sát và các thiết bị điện tử bị thu giữ được cho là thể hiện sự phối hợp trước và sau các sự cố."
      },
      {
        en: "The article also highlights the political sensitivity surrounding the case, as references to “Antifa” have become a [contentious]{gây tranh cãi} issue in U.S. politics. While federal prosecutors describe the defendants’ actions as part of an organized extremist pattern, civil liberties groups caution against broad labeling of loosely connected protest activity as a unified organization. They argue that “Antifa” is not a formal group structure but rather an [ideological]{(thuộc) hệ tư tưởng} label applied to various [anti-fascist]{chống phát-xít} movements.",
        vi: "Bài báo cũng nhấn mạnh tính nhạy cảm chính trị xung quanh vụ án, khi các tham chiếu đến \"Antifa\" đã trở thành một vấn đề gây tranh cãi trong nền chính trị Hoa Kỳ. Trong khi các công tố viên liên bang mô tả hành động của các bị cáo là một phần của mô hình cực đoan có tổ chức, các nhóm tự do dân sự cảnh báo chống lại việc gán nhãn rộng rãi các hoạt động phản kháng kết nối lỏng lẻo như một tổ chức thống nhất. Họ lập luận rằng \"Antifa\" không phải là một cấu trúc nhóm chính thức mà là một nhãn hiệu hệ tư tưởng được áp dụng cho các phong trào chống phát-xít khác nhau."
      },
      {
        en: "The report notes that the case has already [sparked]{khơi mào/gây ra} debate in Washington, with Republican lawmakers calling for expanded investigations into left-wing extremist networks, while some Democrats and legal scholars warn against [overreach]{sự vượt quá thẩm quyền/lạm quyền} that could criminalize protest activity. The Justice Department has not confirmed whether additional arrests are expected but indicated that the investigation remains [ongoing]{đang diễn ra} and may expand beyond Minnesota.",
        vi: "Bản báo cáo lưu ý rằng vụ án đã khơi mào các cuộc tranh luận ở Washington, với việc các nhà lập pháp Đảng Cộng hòa kêu gọi mở rộng các cuộc điều tra về các mạng lưới cực đoan cánh tả, trong khi một số đảng viên Dân chủ và học giả pháp lý cảnh báo chống lại sự lạm quyền có thể hình sự hóa hoạt động biểu tình. Bộ Tư pháp chưa xác nhận liệu có thêm các vụ bắt giữ nào nữa hay không nhưng chỉ ra rằng cuộc điều tra vẫn đang diễn ra và có thể mở rộng ra ngoài Minnesota."
      },
      {
        en: "Ultimately, the article frames the case as part of a larger national debate over domestic extremism, law enforcement priorities, and the [boundaries]{ranh giới} between political protest and criminal [conduct]{hành vi} in an increasingly [polarized]{phân cực} environment.",
        vi: "Cuối cùng, bài viết định khung vụ án như một phần của cuộc tranh luận quốc gia lớn hơn về chủ nghĩa cực đoan trong nước, các ưu tiên thực thi pháp luật và ranh giới giữa biểu tình chính trị và hành vi phạm tội trong một môi trường ngày càng phân cực."
      }
    ]
  },
  {
    source_id: "reuters",
    source_url: "https://www.reuters.com/world/africa/congo-ebola-outbreak-worst-ever-africa-cdc-says-2026-06-16",
    source_label: "Reuters",
    title: "Congo Ebola outbreak may be worst ever, Africa CDC says",
    title_vi: "Đợt bùng phát dịch Ebola ở Congo có thể là tồi tệ nhất từ trước đến nay, Africa CDC cho biết",
    category: "Health",
    category_vi: "Y tế",
    excerpt: "Africa CDC warns the ongoing Ebola outbreak in the Democratic Republic of Congo could become the worst in the continent's history.",
    excerpt_vi: "CDC Châu Phi cảnh báo đợt bùng phát dịch Ebola đang diễn ra tại Cộng hòa Dân chủ Congo có thể trở nên tồi tệ nhất lịch sử lục địa.",
    author: "Reuters Staff",
    read_time: "4 mins",
    image_url: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        en: "The article reports that health officials from the Africa Centres for Disease Control and Prevention (Africa CDC) have warned that the [ongoing]{đang diễn ra} Ebola outbreak in the Democratic Republic of Congo could become the worst in the continent’s history if it is not brought under control quickly. The warning comes as the outbreak continues to expand across multiple provinces in eastern Congo, with officials struggling to track infections and [contain]{kiểm soát/ngăn chặn} [transmission]{sự lây truyền}.",
        vi: "Bài báo đưa tin rằng các quan chức y tế từ Trung tâm Kiểm soát và Phòng ngừa Dịch bệnh Châu Phi (Africa CDC) đã cảnh báo rằng đợt bùng phát dịch Ebola đang diễn ra ở Cộng hòa Dân chủ Congo có thể trở thành đợt bùng phát tồi tệ nhất trong lịch sử châu lục nếu không được kiểm soát nhanh chóng. Lời cảnh báo được đưa ra khi đợt bùng phát tiếp tục lan rộng ra nhiều tỉnh ở phía đông Congo, với việc các quan chức đang chật vật theo dõi các ca nhiễm trùng và ngăn chặn sự lây truyền."
      },
      {
        en: "According to Africa CDC leadership, a major concern is that a large number of potentially exposed individuals have not yet been [traced]{được truy vết}, making it difficult to map the full scale of the outbreak. Health systems in affected regions are facing significant [strain]{sự áp lực/căng thẳng}, with limited laboratory capacity, weak surveillance systems, and challenges in reaching remote or [conflict-affected]{bị ảnh hưởng bởi xung đột} areas. The agency emphasized that delays in identifying and isolating cases could allow the virus to spread further, increasing the risk of a much larger epidemic.",
        vi: "Theo ban lãnh đạo Africa CDC, mối lo ngại lớn là một số lượng lớn các cá nhân có khả năng bị phơi nhiễm vẫn chưa được truy vết, khiến việc lập bản đồ quy mô đầy đủ của đợt bùng phát trở nên khó khăn. Các hệ thống y tế ở các khu vực bị ảnh hưởng đang đối mặt với áp lực lớn, với năng lực phòng thí nghiệm hạn chế, hệ thống giám sát yếu kém và những thách thức trong việc tiếp cận các vùng sâu vùng xa hoặc vùng bị ảnh hưởng bởi xung đột. Cơ quan này nhấn mạnh rằng sự chậm trễ trong việc xác định và cách ly các trường hợp có thể cho phép virus lây lan rộng hơn, làm tăng nguy cơ xảy ra một trận đại dịch lớn hơn nhiều."
      },
      {
        en: "The article highlights that the current outbreak is being compared to previous major Ebola crises in Africa, including the 2014–2016 West Africa [epidemic]{dịch bệnh}, which caused over 11,000 deaths. Officials note that while lessons from past outbreaks have improved response tools such as contact tracing and rapid [diagnostics]{chẩn đoán}, [implementation]{sự thực thi/triển khai} on the ground remains inconsistent, particularly in regions with insecurity and limited infrastructure.",
        vi: "Bài báo nêu bật rằng đợt bùng phát hiện tại đang được so sánh với các cuộc khủng hoảng Ebola lớn trước đây ở Châu Phi, bao gồm cả dịch bệnh Tây Phi giai đoạn 2014–2016 đã gây ra hơn 11.000 ca tử vong. Các quan chức lưu ý rằng mặc dù các bài học từ các đợt bùng phát trong quá khứ đã cải thiện các công cụ ứng phó như truy vết tiếp xúc và chẩn đoán nhanh, việc triển khai trên thực địa vẫn không đồng nhất, đặc biệt là ở các khu vực bất ổn an ninh và cơ sở hạ tầng hạn chế."
      },
      {
        en: "Public health experts cited in the report also warn that community mistrust, population movement, and weak healthcare access are [accelerating]{đẩy nhanh} transmission. In some areas, fear of health workers and [resistance]{sự kháng cự/phản đối} to [containment]{sự ngăn chặn/dập dịch} measures have made it harder to isolate patients and conduct safe burials, both of which are critical to stopping Ebola spread.",
        vi: "Các chuyên gia y tế công cộng được trích dẫn trong báo cáo cũng cảnh báo rằng sự ngờ vực của cộng đồng, sự di chuyển dân cư và khả năng tiếp cận chăm sóc sức khỏe yếu kém đang đẩy nhanh sự lây truyền. Ở một số khu vực, nỗi sợ hãi đối với nhân viên y tế và sự phản đối các biện pháp ngăn chặn đã khiến việc cách ly bệnh nhân và thực hiện các vụ chôn cất an toàn trở nên khó khăn hơn, cả hai điều này đều rất quan trọng để ngăn chặn sự lây lan của Ebola."
      },
      {
        en: "Overall, the article frames the situation as a rapidly [evolving]{tiến triển/phát triển} public health emergency, with authorities urging [urgent]{khẩn cấp} international support and coordination to prevent the outbreak from [escalating]{leo thang} into a continental crisis.",
        vi: "Nhìn chung, bài báo định khung tình hình như một tình trạng khẩn cấp y tế công cộng đang diễn ra nhanh chóng, với việc các nhà chức trách kêu gọi sự hỗ trợ và phối hợp quốc tế khẩn cấp để ngăn chặn đợt bùng phát leo thang thành một cuộc khủng hoảng toàn châu lục."
      }
    ]
  },
  {
    source_id: "the-new-york-times",
    source_url: "https://www.nytimes.com/2026/06/16/world/global-instability-iran-war-epstein-world-cup-politics",
    source_label: "The New York Times",
    title: "Global instability deepens as Iran war reshapes economy, Epstein scrutiny resurfaces, and World Cup becomes political stage",
    title_vi: "Bất ổn toàn cầu sâu sắc khi chiến tranh Iran tái định hình nền kinh tế, sự giám sát về vụ Epstein trỗi dậy, và World Cup trở thành sân khấu chính trị",
    category: "World",
    category_vi: "Thế giới",
    excerpt: "A look at a world increasingly shaped by overlapping crises, from the U.S.-Iran conflict to renewed Epstein scrutiny and World Cup politics.",
    excerpt_vi: "Cái nhìn về một thế giới ngày càng bị định hình bởi các cuộc khủng hoảng chồng chéo, từ xung đột Mỹ-Iran đến hồ sơ Epstein và chính trị World Cup.",
    author: "The New York Times Staff",
    read_time: "5 mins",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    content: [
      {
        en: "The article describes a world increasingly shaped by [overlapping]{chồng chéo} crises, with the ongoing U.S.–Iran conflict continuing to drive major global economic and political consequences. According to reporting, the war—initiated earlier in 2026—has disrupted energy markets, increased [inflationary]{(thuộc) lạm phát} pressure, and [destabilized]{làm mất ổn định} trade routes such as the Strait of Hormuz. Economists cited in the coverage warn that despite recent diplomatic signals suggesting a possible ceasefire framework, the situation remains fragile, and global markets are still highly sensitive to any escalation or breakdown in negotiations.",
        vi: "Bài báo mô tả một thế giới ngày càng bị định hình bởi các cuộc khủng hoảng chồng chéo, với cuộc xung đột Mỹ-Iran đang diễn ra tiếp tục dẫn đến các hậu quả kinh tế và chính trị toàn cầu lớn. Theo báo cáo, cuộc chiến — được khơi mào vào đầu năm 2026 — đã gây gián đoạn thị trường năng lượng, tăng áp lực lạm phát và làm mất ổn định các tuyến đường thương mại như eo biển Hormuz. Các nhà kinh tế được trích dẫn trong bài viết cảnh báo rằng bất chấp các tín hiệu ngoại giao gần đây gợi ý về một khuôn khổ ngừng bắn khả thi, tình hình vẫn mong manh và thị trường toàn cầu vẫn rất nhạy cảm với bất kỳ sự leo thang hoặc đổ vỡ nào trong các cuộc đàm phán."
      },
      {
        en: "Energy prices and investor [sentiment]{tâm lý} remain heavily influenced by developments in the Middle East, with [fluctuations]{sự dao động/biến động} in oil supply linked to Iranian shipping activity and military tensions. Analysts note that even partial stabilization has triggered short-term optimism in European markets, but long-term uncertainty continues due to unresolved political and nuclear-related [disputes]{các tranh chấp}. The article frames the conflict as one of the most significant drivers of global macroeconomic instability in 2026, affecting inflation, trade flows, and fiscal policy decisions in multiple regions.",
        vi: "Giá năng lượng và tâm lý nhà đầu tư vẫn bị ảnh hưởng nặng nề bởi những diễn biến ở Trung Đông, với những biến động trong nguồn cung dầu liên quan đến hoạt động vận tải biển của Iran và căng thẳng quân sự. Các nhà phân tích lưu ý rằng ngay cả sự ổn định một phần cũng đã kích hoạt sự lạc quan ngắn hạn ở thị trường châu Âu, nhưng sự không chắc chắn dài hạn vẫn tiếp diễn do các tranh chấp chính trị và liên quan đến hạt nhân chưa được giải quyết. Bài viết coi cuộc xung đột là một trong những động lực đáng kể nhất gây ra bất ổn vĩ mô toàn cầu vào năm 2026, ảnh hưởng đến lạm phát, dòng chảy thương mại và các quyết định chính sách tài khóa ở nhiều khu vực."
      },
      {
        en: "In parallel, the article references renewed public and legal attention surrounding Jeffrey Epstein, as unresolved questions about his network, institutional connections, and previous plea agreements continue to [circulate]{lan truyền/lưu hành} in political and media [discourse]{diễn ngôn/luồng dư luận}. While no new major legal developments are reported in this specific update, Epstein remains a recurring [reference point]{điểm tham chiếu/mốc đối chiếu} in discussions about elite accountability and systemic failure in U.S. institutions.",
        vi: "Song song đó, bài viết đề cập đến sự chú ý của công chúng và pháp lý được đổi mới xung quanh Jeffrey Epstein, khi những câu hỏi chưa được giải quyết về mạng lưới của ông ta, các mối quan hệ thể chế và các thỏa thuận nhận tội trước đó tiếp tục lan truyền trong diễn ngôn chính trị và truyền thông. Mặc dù không có diễn biến pháp lý lớn mới nào được đưa tin trong bản cập nhật cụ thể này, Epstein vẫn là một điểm tham chiếu thường xuyên trong các cuộc thảo luận về trách nhiệm giải trình của giới tinh hoa và sự thất bại mang tính hệ thống trong các tổ chức của Mỹ."
      },
      {
        en: "The World Cup is also highlighted as a politically charged global event, particularly due to tensions involving Iran’s participation in matches hosted in the United States. Iran’s national team continues to face [logistical]{(thuộc) hậu cần} restrictions, visa complications, and travel disruptions linked to geopolitical tensions, including forced [relocation]{sự di dời} of its training base and limited access for staff members. These issues have turned matches into broader political [flashpoints]{điểm nóng}, with fan protests, security restrictions, and diplomatic commentary surrounding games.",
        vi: "World Cup cũng được nêu bật như một sự kiện toàn cầu mang tính chính trị mạnh mẽ, đặc biệt là do những căng thẳng liên quan đến sự tham gia của Iran trong các trận đấu được tổ chức tại Hoa Kỳ. Đội tuyển quốc gia của Iran tiếp tục đối mặt với các hạn chế về hậu cần, các biến chứng về thị thực và sự gián đoạn đi lại liên quan đến căng thẳng địa chính trị, bao gồm cả việc buộc phải di dời căn cứ tập luyện và quyền tiếp cận hạn chế của các nhân viên. Những vấn đề này đã biến các trận đấu thành các điểm nóng chính trị rộng lớn hơn, với các cuộc biểu tình của người hâm mộ, các hạn chế an ninh và bình luận ngoại giao xung quanh các trận đấu."
      },
      {
        en: "Overall, the article portrays a global environment defined by [interconnected]{kết nối lẫn nhau/liên đới} instability: a major regional war affecting the world economy, ongoing political and legal controversies in the United States, and an international sporting event that has become [entangled]{bị vướng vào/can dự} in geopolitical conflict. Together, these developments [illustrate]{minh họa} how politics, economics, and culture are increasingly overlapping on a global scale in 2026.",
        vi: "Nhìn chung, bài viết khắc họa một môi trường toàn cầu được định nghĩa bởi sự bất ổn kết nối lẫn nhau: một cuộc chiến tranh khu vực lớn ảnh hưởng đến nền kinh tế thế giới, các tranh cãi chính trị và pháp lý đang diễn ra ở Hoa Kỳ, và một sự kiện thể thao quốc tế đã bị vướng vào xung đột địa chính trị. Cùng với nhau, những diễn biến này minh họa cách chính trị, kinh tế và văn hóa ngày càng chồng chéo lên nhau trên quy mô toàn cầu vào năm 2026."
      }
    ]
  }
];

async function main() {
  console.log("Inserting 5 new bilingual articles...");
  for (const article of articlesToInsert) {
    console.log(`Inserting: "${article.title}"...`);
    const { data, error } = await supabaseAdmin
      .from("bilingual_articles")
      .insert(article)
      .select();

    if (error) {
      console.error(`Error inserting "${article.title}":`, error);
    } else {
      console.log(`Successfully inserted: "${article.title}"`, data?.[0]?.id);
    }
  }
}

main().catch(console.error);
