export interface CambridgeDictEntry {
  word: string;
  partOfSpeech: string;
  ipaUk: string;
  ipaUs: string;
  definition: string;
  translation: string;
  exampleSentence: string;
  exampleTranslation?: string;
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

export const cambridgeDictionary: Record<string, CambridgeDictEntry[]> = {
  proponents: [
    {
      word: "proponent",
      partOfSpeech: "noun",
      ipaUk: "/prəˈpəʊ.nənt/",
      ipaUs: "/prəˈpoʊ.nənt/",
      definition: "A person who speaks publicly in support of a particular idea or plan of action.",
      translation: "Người ủng hộ, người đề xuất",
      exampleSentence: "He is one of the leading proponents of urban agriculture and green buildings.",
      exampleTranslation: "Ông là một trong những người ủng hộ hàng đầu của nông nghiệp đô thị và các tòa nhà xanh.",
      level: "C1"
    }
  ],
  proponent: [
    {
      word: "proponent",
      partOfSpeech: "noun",
      ipaUk: "/prəˈpəʊ.nənt/",
      ipaUs: "/prəˈpoʊ.nənt/",
      definition: "A person who speaks publicly in support of a particular idea or plan of action.",
      translation: "Người ủng hộ, người đề xuất",
      exampleSentence: "He is one of the leading proponents of urban agriculture and green buildings.",
      exampleTranslation: "Ông là một trong những người ủng hộ hàng đầu của nông nghiệp đô thị và các tòa nhà xanh.",
      level: "C1"
    }
  ],
  emissions: [
    {
      word: "emission",
      partOfSpeech: "noun",
      ipaUk: "/iˈmɪʃ.ən/",
      ipaUs: "/iˈmɪʃ.ən/",
      definition: "An amount of gas, heat, light, etc. that is sent out.",
      translation: "Sự phát thải, lượng khí thải",
      exampleSentence: "Many countries are trying to reduce their greenhouse gas emissions to combat climate change.",
      exampleTranslation: "Nhiều quốc gia đang cố gắng cắt giảm lượng phát thải khí nhà kính để chống lại biến đổi khí hậu.",
      level: "B2"
    }
  ],
  emission: [
    {
      word: "emission",
      partOfSpeech: "noun",
      ipaUk: "/iˈmɪʃ.ən/",
      ipaUs: "/iˈmɪʃ.ən/",
      definition: "An amount of gas, heat, light, etc. that is sent out.",
      translation: "Sự phát thải, lượng khí thải",
      exampleSentence: "Many countries are trying to reduce their greenhouse gas emissions to combat climate change.",
      exampleTranslation: "Nhiều quốc gia đang cố gắng cắt giảm lượng phát thải khí nhà kính để chống lại biến đổi khí hậu.",
      level: "B2"
    }
  ],
  segregated: [
    {
      word: "segregated",
      partOfSpeech: "adjective",
      ipaUk: "/ˈseɡ.rɪ.ɡeɪ.tɪd/",
      ipaUs: "/ˈseɡ.rə.ɡeɪ.t̬ɪd/",
      definition: "Kept separate, especially because of different races, sexes, religions, or functions.",
      translation: "Bị chia tách, cách biệt, cô lập",
      exampleSentence: "Food production was historically segregated from urban life and restricted to rural fields.",
      exampleTranslation: "Sản xuất thực phẩm trong lịch sử đã bị tách biệt khỏi đời sống đô thị và chỉ giới hạn ở các vùng nông thôn.",
      level: "C1"
    }
  ],
  unripe: [
    {
      word: "unripe",
      partOfSpeech: "adjective",
      ipaUk: "/ʌnˈraɪp/",
      ipaUs: "/ʌnˈraɪp/",
      definition: "Not yet ready to be eaten or collected; not fully developed.",
      translation: "Chưa chín, còn xanh (trái cây, rau củ)",
      exampleSentence: "Fruit and vegetables are often picked unripe to survive long transportation journeys.",
      exampleTranslation: "Trái cây và rau quả thường được hái khi chưa chín để tồn tại qua các hành trình vận chuyển dài ngày.",
      level: "B1"
    }
  ],
  footprint: [
    {
      word: "footprint",
      partOfSpeech: "noun",
      ipaUk: "/ˈfʊt.prɪnt/",
      ipaUs: "/ˈfʊt.prɪnt/",
      definition: "The amount of space on a surface that is filled by something, or a measurement of the impact on environment (e.g. carbon footprint).",
      translation: "Diện tích chiếm dụng (bề mặt), dấu chân, dấu vết carbon",
      exampleSentence: "Vertical farming allows crops to be stacked, drastically reducing the physical footprint required.",
      exampleTranslation: "Canh tác thẳng đứng cho phép cây trồng được xếp chồng lên nhau, giảm đáng kể diện tích chiếm dụng vật lý cần thiết.",
      level: "B2"
    }
  ],
  yield: [
    {
      word: "yield",
      partOfSpeech: "noun",
      ipaUk: "/jiːld/",
      ipaUs: "/jiːld/",
      definition: "An amount of something positive, such as food or profit, that is produced or generated.",
      translation: "Sản lượng, năng suất, lợi nhuận",
      exampleSentence: "Modern hydroponic farms can produce up to ten times the yield of traditional soil agriculture.",
      exampleTranslation: "Các trang trại thủy canh hiện đại có thể tạo ra sản lượng gấp mười lần so với canh tác đất truyền thống.",
      level: "C1"
    },
    {
      word: "yield",
      partOfSpeech: "verb",
      ipaUk: "/jiːld/",
      ipaUs: "/jiːld/",
      definition: "To produce or provide something, such as a crop or profit.",
      translation: "Mang lại, đem lại, sản sinh ra",
      exampleSentence: "These new agricultural methods yield high-quality organic vegetables year-round.",
      exampleTranslation: "Những phương pháp nông nghiệp mới này mang lại các loại rau hữu cơ chất lượng cao quanh năm.",
      level: "C1"
    }
  ],
  hurdles: [
    {
      word: "hurdle",
      partOfSpeech: "noun",
      ipaUk: "/ˈhɜː.dəl/",
      ipaUs: "/ˈhɝː.dəl/",
      definition: "A frame or barrier for jumping over, or a problem or difficulty that must be solved before you can achieve something.",
      translation: "Rào cản, chướng ngại vật, khó khăn",
      exampleSentence: "High energy consumption and initial set-up cost are two major hurdles in vertical farming.",
      exampleTranslation: "Tiêu thụ nhiều năng lượng và chi phí thiết lập ban đầu là hai rào cản lớn trong canh tác thẳng đứng.",
      level: "C1"
    }
  ],
  hurdle: [
    {
      word: "hurdle",
      partOfSpeech: "noun",
      ipaUk: "/ˈhɜː.dəl/",
      ipaUs: "/ˈhɝː.dəl/",
      definition: "A frame or barrier for jumping over, or a problem or difficulty that must be solved before you can achieve something.",
      translation: "Rào cản, chướng ngại vật, khó khăn",
      exampleSentence: "The company faces several financial hurdles that it must overcome to stay viable.",
      exampleTranslation: "Công ty phải đối mặt với một số rào cản tài chính mà họ phải vượt qua để tiếp tục tồn tại.",
      level: "C1"
    }
  ],
  viability: [
    {
      word: "viability",
      partOfSpeech: "noun",
      ipaUk: "/ˌvaɪ.əˈbɪl.ə.ti/",
      ipaUs: "/ˌvaɪ.əˈbɪl.ə.t̬i/",
      definition: "The ability to work as intended or to succeed.",
      translation: "Khả năng tồn tại, tính khả thi, tính bền vững",
      exampleSentence: "Integrating renewable energy sources is vital for the long-term viability of high-tech farms.",
      exampleTranslation: "Tích hợp các nguồn năng lượng tái tạo là cực kỳ quan trọng đối với khả năng tồn tại lâu dài của các trang trại công nghệ cao.",
      level: "C2"
    }
  ],
  vital: [
    {
      word: "vital",
      partOfSpeech: "adjective",
      ipaUk: "/ˈvaɪ.təl/",
      ipaUs: "/ˈvaɪ.t̬əl/",
      definition: "Necessary for the success or continued existence of something; extremely important.",
      translation: "Sống còn, cực kỳ quan trọng, thiết yếu",
      exampleSentence: "Good nutrition and regular exercise are vital for maintaining a healthy life.",
      exampleTranslation: "Dinh dưỡng tốt và tập thể dục thường xuyên là điều thiết yếu để duy trì một cuộc sống khỏe mạnh.",
      level: "B2"
    }
  ],
  accommodate: [
    {
      word: "accommodate",
      partOfSpeech: "verb",
      ipaUk: "/əˈkɒm.ə.deɪt/",
      ipaUs: "/əˈkɑː.mə.deɪt/",
      definition: "To provide with a place to live or to be stored; to have space for.",
      translation: "Chứa được, cung cấp chỗ ở, đáp ứng",
      exampleSentence: "The new conference room can easily accommodate up to eighty attendees.",
      exampleTranslation: "Phòng hội nghị mới có thể dễ dàng chứa được tới tám mươi người tham dự.",
      level: "B2"
    }
  ],
  attendees: [
    {
      word: "attendee",
      partOfSpeech: "noun",
      ipaUk: "/ə.tenˈdiː/",
      ipaUs: "/ə.tenˈdi/",
      definition: "Someone who goes to a meeting, conference, or class.",
      translation: "Người tham dự, người có mặt",
      exampleSentence: "All attendees are required to register at the front desk and collect their name badges.",
      exampleTranslation: "Tất cả những người tham dự được yêu cầu đăng ký tại bàn tiếp tân và nhận bảng tên của họ.",
      level: "C1"
    }
  ],
  attendee: [
    {
      word: "attendee",
      partOfSpeech: "noun",
      ipaUk: "/ə.tenˈdiː/",
      ipaUs: "/ə.tenˈdi/",
      definition: "Someone who goes to a meeting, conference, or class.",
      translation: "Người tham dự, người có mặt",
      exampleSentence: "Each attendee will receive a copy of the seminar handbook.",
      exampleTranslation: "Mỗi người tham dự sẽ nhận được một bản sao của cuốn sổ tay hội thảo.",
      level: "C1"
    }
  ],
  capacity: [
    {
      word: "capacity",
      partOfSpeech: "noun",
      ipaUk: "/kəˈpæs.ə.ti/",
      ipaUs: "/kəˈpæs.ə.t̬i/",
      definition: "The total amount that can be contained or produced, or the maximum amount of attendees.",
      translation: "Sức chứa, công suất, năng lực",
      exampleSentence: "The stadium has a seating capacity of over fifty thousand sports fans.",
      exampleTranslation: "Sân vận động có sức chứa chỗ ngồi hơn năm mươi nghìn người hâm mộ thể thao.",
      level: "B2"
    }
  ],
  "state-of-the-art": [
    {
      word: "state-of-the-art",
      partOfSpeech: "adjective",
      ipaUk: "/ˌsteɪt.əv.ði.ˈɑːt/",
      ipaUs: "/ˌsteɪt.əv.ði.ˈɑːrt/",
      definition: "Very modern and using the most recent ideas and methods.",
      translation: "Tối tân, hiện đại nhất, tiên tiến nhất",
      exampleSentence: "The Richmond Suite is equipped with a state-of-the-art sound system and projector.",
      exampleTranslation: "Richmond Suite được trang bị hệ thống âm thanh và máy chiếu tối tân hiện đại nhất.",
      level: "C1"
    }
  ],
  refreshments: [
    {
      word: "refreshment",
      partOfSpeech: "noun",
      ipaUk: "/rɪˈfreʃ.mənt/",
      ipaUs: "/rɪˈfreʃ.mənt/",
      definition: "Drinks and small amounts of food that are provided in a public place or at a meeting.",
      translation: "Đồ uống giải khát, thức ăn nhẹ, điểm tâm",
      exampleSentence: "Light refreshments like tea, coffee, and biscuits will be served during the afternoon break.",
      exampleTranslation: "Các món ăn nhẹ giải khát như trà, cà phê và bánh quy sẽ được phục vụ trong giờ nghỉ chiều.",
      level: "B2"
    }
  ],
  refreshment: [
    {
      word: "refreshment",
      partOfSpeech: "noun",
      ipaUk: "/rɪˈfreʃ.mənt/",
      ipaUs: "/rɪˈfreʃ.mənt/",
      definition: "Drinks and small amounts of food that are provided in a public place or at a meeting.",
      translation: "Đồ uống giải khát, thức ăn nhẹ, điểm tâm",
      exampleSentence: "They provided a table with refreshments for the weary travelers.",
      exampleTranslation: "Họ cung cấp một chiếc bàn với đồ ăn nhẹ giải khát cho những người du hành mệt mỏi.",
      level: "B2"
    }
  ],
  deposit: [
    {
      word: "deposit",
      partOfSpeech: "noun",
      ipaUk: "/dɪˈpɒz.ɪt/",
      ipaUs: "/dɪˈpɑː.zɪt/",
      definition: "An amount of money that you pay when you rent something and that is returned to you when you return the thing, or a payment to secure a booking.",
      translation: "Tiền đặt cọc, tiền gửi vào tài khoản",
      exampleSentence: "We require a security deposit of one hundred dollars to secure the room booking.",
      exampleTranslation: "Chúng tôi yêu cầu số tiền đặt cọc bảo đảm là một trăm đô la để giữ chỗ phòng.",
      level: "B1"
    },
    {
      word: "deposit",
      partOfSpeech: "verb",
      ipaUk: "/dɪˈpɒz.ɪt/",
      ipaUs: "/dɪˈpɑː.zɪt/",
      definition: "To put something valuable in a safe place, or to pay a sum of money as deposit.",
      translation: "Đặt cọc, gửi tiền (vào ngân hàng)",
      exampleSentence: "She deposited the check into her savings account yesterday morning.",
      exampleTranslation: "Cô ấy đã gửi tấm séc vào tài khoản tiết kiệm của mình sáng ngày hôm qua.",
      level: "B1"
    }
  ],
  secure: [
    {
      word: "secure",
      partOfSpeech: "verb",
      ipaUk: "/sɪˈkjʊər/",
      ipaUs: "/sɪˈkjʊr/",
      definition: "To obtain or achieve something, or to make something safe and protected.",
      translation: "Bảo đảm, giữ chỗ an toàn, đạt được",
      exampleSentence: "You need to pay a small security deposit to secure your room booking.",
      exampleTranslation: "Bạn cần thanh toán một khoản tiền cọc nhỏ để đảm bảo giữ chỗ đặt phòng của mình.",
      level: "B2"
    },
    {
      word: "secure",
      partOfSpeech: "adjective",
      ipaUk: "/sɪˈkjʊər/",
      ipaUs: "/sɪˈkjʊr/",
      definition: "Safe and not likely to be at risk or in danger.",
      translation: "An toàn, chắc chắn, được bảo vệ",
      exampleSentence: "Please make sure your password is secure and not easily guessed.",
      exampleTranslation: "Hãy đảm bảo rằng mật khẩu của bạn an toàn và không dễ bị đoán ra.",
      level: "B2"
    }
  ],
  sustainable: [
    {
      word: "sustainable",
      partOfSpeech: "adjective",
      ipaUk: "/səˈsteɪ.nə.bəl/",
      ipaUs: "/səˈsteɪ.nə.bəl/",
      definition: "Able to continue over a period of time; causing little or no damage to the environment.",
      translation: "Bền vững, có tính bền vững",
      exampleSentence: "Urban farming helps create a more sustainable urban ecosystem.",
      exampleTranslation: "Canh tác đô thị giúp tạo ra một hệ sinh thái đô thị bền vững hơn.",
      level: "B2"
    }
  ],
  resilient: [
    {
      word: "resilient",
      partOfSpeech: "adjective",
      ipaUk: "/rɪˈzɪl.i.ənt/",
      ipaUs: "/rɪˈzɪl.jənt/",
      definition: "Able to be happy, successful, etc. again after something difficult or bad has happened, or returning to original shape.",
      translation: "Kiên cường, bền bỉ, có khả năng phục hồi nhanh",
      exampleSentence: "Urban agriculture offers a resilient buffer against food supply chain disruptions.",
      exampleTranslation: "Nông nghiệp đô thị cung cấp một bước đệm bền bỉ chống lại sự gián đoạn chuỗi cung ứng thực phẩm.",
      level: "C1"
    }
  ],
  innovative: [
    {
      word: "innovative",
      partOfSpeech: "adjective",
      ipaUk: "/ˈɪn.ə.və.tɪv/",
      ipaUs: "/ˈɪn.ə.veɪ.t̬ɪv/",
      definition: "Using new methods or ideas.",
      translation: "Mang tính đổi mới, sáng tạo, đột phá",
      exampleSentence: "Her design for the new vertical farm was highly innovative and cost-effective.",
      exampleTranslation: "Thiết kế của cô ấy cho trang trại thẳng đứng mới mang tính đột phá cao và tiết kiệm chi phí.",
      level: "B2"
    }
  ],
  hydroponics: [
    {
      word: "hydroponics",
      partOfSpeech: "noun",
      ipaUk: "/ˌhaɪ.drəˈpɒn.ɪks/",
      ipaUs: "/ˌhaɪ.drəˈpɑː.nɪks/",
      definition: "The science of growing plants without soil, in water with nutrients added.",
      translation: "Phương pháp thủy canh (trồng cây trong nước dinh dưỡng)",
      exampleSentence: "One of the most promising methods in urban farming is hydroponics.",
      exampleTranslation: "Một trong những phương pháp triển vọng nhất trong canh tác đô thị là thủy canh.",
      level: "C2"
    }
  ]
};
