import type { Messages } from './en';

/** Tiếng Việt */
export const vi: Messages = {
  appName: 'Haze Watch',
  tagline: 'Chất lượng không khí Đông Nam Á',
  pageTitle: 'Haze Watch · Chất lượng không khí Đông Nam Á',
  cityPageTitle: (city, aqi, category) => `${city}: AQI Mỹ ${aqi} (${category}) · Haze Watch`,
  skipToContent: 'Chuyển đến nội dung chính',
  language: 'Ngôn ngữ',
  refresh: 'Làm mới',
  dataFor: 'Dữ liệu lúc',
  checked: time => `kiểm tra lúc ${time}`,
  loadingReadings: 'Đang tải số liệu…',
  tryAgain: 'Thử lại',
  noData: 'Không có dữ liệu',

  loadErrorTitle: 'Không tải được số liệu mới',
  showingReadingsFor: time => `Đang hiển thị số liệu lúc ${time}.`,
  errors: {
    offline: 'Không kết nối được dịch vụ chất lượng không khí. Hãy kiểm tra kết nối rồi thử lại.',
    rateLimited: 'Dịch vụ chất lượng không khí đang giới hạn số yêu cầu. Hãy thử lại sau vài phút.',
    api: detail => `Dịch vụ chất lượng không khí báo lỗi: ${detail}`,
    unexpected: 'Đã xảy ra lỗi khi tải dữ liệu chất lượng không khí.'
  },

  overviewLabel: 'Tổng quan khu vực',
  overviewMeta: cities => `${cities} thành phố · AQI Mỹ`,
  worstRightNow: 'Tệ nhất hiện nay:',
  loadingOverview: cities => `Đang tải số liệu mới nhất cho ${cities} thành phố…`,
  readingsUnavailable: 'Hiện không có số liệu chất lượng không khí',
  headlineNone: 'Hiện chưa có số liệu',
  headlineUnhealthy: (n, total) => `Không khí có hại ở ${n}/${total} thành phố`,
  headlineSensitive: (n, total) => `Có hại cho nhóm nhạy cảm ở ${n}/${total} thành phố`,
  headlineClear: total => `Không khí tốt hoặc trung bình ở cả ${total} thành phố`,
  legendLabel: 'Số thành phố trong mỗi mức AQI Mỹ',
  cityCount: () => ' thành phố',

  mapTitle: 'Bản đồ · AQI Mỹ theo thành phố',
  mapLabel: 'Bản đồ AQI Mỹ theo thành phố',
  mapLoading: 'Đang tải bản đồ…',
  mapHint: 'Điểm đánh dấu cho biết AQI Mỹ. Chọn một điểm hoặc một thành phố trong danh sách để xem chi tiết và dự báo 4 ngày.',
  mapAttribution: 'Bản đồ nền',

  selectedCity: 'Thành phố đã chọn',
  modelEstimate: time =>
    `Ước tính theo mô hình lúc ${time}. AQI lấy trung bình bụi mịn trong 24 giờ qua nên có thể vẫn cao một thời gian sau khi không khí đã sạch hơn.`,
  healthAdvice: 'Khuyến nghị sức khỏe',
  pm25ThisHour: 'PM2.5 giờ này',
  whoGuideline: value => `Ngưỡng hướng dẫn 24 giờ của WHO: ${value}`,
  haze: 'Khói mù',
  aerosolOpticalDepth: value => `Độ sâu quang học sol khí ${value}`,
  wind: 'Gió',
  windNote: 'Mũi tên chỉ hướng khói đang trôi',
  windUnavailable: 'Không có',
  windCalm: 'Lặng gió',
  windFrom: (kmh, direction) => `${kmh} km/h, hướng ${direction}`,
  ozone: 'Ozon',
  carbonMonoxide: 'Cacbon monoxit',
  noReading: 'Hiện chưa có số liệu cho thành phố này.',

  dailyOutlook: 'Xu hướng theo ngày',
  localTimeIn: city => `giờ địa phương ${city}`,
  day: 'Ngày',
  peakUsAqi: 'AQI Mỹ cao nhất',
  peakPm25: 'PM2.5 cao nhất',
  today: 'Hôm nay',
  tomorrow: 'Ngày mai',
  forecastError: 'Không tải được dự báo',

  chartTitle: 'AQI Mỹ theo giờ',
  chartRange: '2 ngày qua và dự báo 4 ngày tới.',
  chartAriaTitle: 'Biểu đồ AQI Mỹ theo giờ.',
  chartNow: reading => `Hiện tại ${reading}.`,
  chartForecastPeak: (reading, when) => `Đỉnh dự báo ${reading} vào ${when}.`,
  chartNowLabel: 'Bây giờ',
  chartPeakLabel: (aqi, when) => `Đỉnh ${aqi} · ${when}`,
  chartHint: 'Trỏ vào biểu đồ để xem số liệu từng giờ.',
  chartKeyHistory: 'Số liệu mô hình đã qua',
  chartKeyForecast: 'Dự báo',
  chartKeyPeak: 'Đỉnh dự báo',
  chartEmpty: 'Không đủ dữ liệu theo giờ để vẽ biểu đồ cho thành phố này.',

  citiesHeading: 'Thành phố',
  country: 'Quốc gia',
  allCountries: 'Tất cả quốc gia',
  sort: 'Sắp xếp',
  sortWorst: 'Không khí tệ nhất trước',
  sortBest: 'Không khí sạch nhất trước',
  sortName: 'Tên (A–Z)',
  listSummary: (n, country, order) =>
    `${country ? `${n} thành phố ở ${country}` : `${n} thành phố`}, ${{ worst: 'không khí tệ nhất trước', best: 'không khí sạch nhất trước', name: 'A–Z' }[order]}`,
  noCitiesMatch: 'Không có thành phố nào phù hợp với bộ lọc này.',

  showing: (city, aqi, category) => `Đang hiển thị ${city}: AQI Mỹ ${aqi}, ${category}.`,
  showingNoData: city => `Đang hiển thị ${city}.`,

  aboutHeading: 'Về dữ liệu này',
  aboutModelBefore: 'Các số liệu là ',
  aboutModelStrong: 'ước tính theo mô hình',
  aboutModelAfter:
    ' của Dịch vụ Giám sát Khí quyển Copernicus (CAMS), do Open-Meteo cung cấp trên lưới khoảng 45 km. Số liệu phản ánh tốt khói trên phạm vi khu vực nhưng có thể khác với trạm quan trắc mặt đất, nhất là gần điểm cháy hoặc ở trung tâm đô thị đông đúc. Khi trang đang mở, số liệu mới được lấy ngay sau mỗi giờ.',
  aboutIndex:
    'Các giá trị dùng Chỉ số chất lượng không khí (AQI) của EPA Hoa Kỳ. Chỉ số của từng quốc gia được tính khác nhau, nên PSI của Singapore, API của Malaysia và ISPU của Indonesia sẽ không khớp hoàn toàn với các con số này.',
  sourcesHeading: 'Số liệu và khuyến cáo chính thức',
  sources: {
    sg: 'Singapore: Thông tin khói mù của NEA',
    my: 'Malaysia: Chỉ số ô nhiễm không khí (APIMS)',
    id: 'Indonesia: Chỉ số tiêu chuẩn ô nhiễm không khí (ISPU)',
    th: 'Thái Lan: Air4Thai',
    asmc: 'Trung tâm Khí tượng Chuyên ngành ASEAN: khói mù và điểm nóng trong khu vực',
    firms: 'NASA FIRMS: bản đồ điểm cháy'
  },
  footerDataBefore: 'Dữ liệu chất lượng không khí và gió từ ',
  footerDataAfter:
    ' (CC BY 4.0), tạo từ thông tin của Dịch vụ Giám sát Khí quyển Copernicus. Dữ liệu bản đồ © những người đóng góp OpenStreetMap.',
  footerDisclaimer: 'Đây không phải khuyến cáo chính thức. Hãy làm theo hướng dẫn của chính quyền địa phương.',

  categories: {
    good: { label: 'Tốt', short: 'Tốt', advice: 'Chất lượng không khí tốt. Bạn có thể hoạt động ngoài trời như bình thường.' },
    moderate: {
      label: 'Trung bình',
      short: 'Trung bình',
      advice:
        'Chấp nhận được với hầu hết mọi người. Nếu bạn đặc biệt nhạy cảm với ô nhiễm không khí, hãy cân nhắc rút ngắn hoặc giảm cường độ hoạt động ngoài trời.'
    },
    sensitive: {
      label: 'Có hại cho nhóm nhạy cảm',
      short: 'Nhóm nhạy cảm',
      advice: 'Trẻ em, người cao tuổi, phụ nữ mang thai và người có bệnh tim hoặc phổi nên hạn chế hoạt động ngoài trời kéo dài hoặc gắng sức.'
    },
    unhealthy: {
      label: 'Có hại cho sức khỏe',
      short: 'Có hại',
      advice:
        'Mọi người nên hạn chế hoạt động ngoài trời kéo dài hoặc gắng sức; nhóm nhạy cảm nên tránh. Đeo khẩu trang N95 vừa khít nếu phải ở ngoài trời lâu.'
    },
    'very-unhealthy': {
      label: 'Rất có hại cho sức khỏe',
      short: 'Rất có hại',
      advice:
        'Mọi người nên tránh hoạt động ngoài trời kéo dài hoặc gắng sức. Nhóm nhạy cảm nên ở trong nhà, đóng cửa sổ và bật máy lọc không khí nếu có.'
    },
    hazardous: {
      label: 'Nguy hại',
      short: 'Nguy hại',
      advice:
        'Mọi người nên tránh mọi hoạt động thể chất ngoài trời, ở trong nhà và đóng cửa sổ. Làm theo khuyến cáo của cơ quan y tế địa phương.'
    }
  },
  hazeLevels: { clear: 'Trong', light: 'Khói mù nhẹ', hazy: 'Có khói mù', thick: 'Khói mù dày' },
  compass: { N: 'Bắc', NE: 'Đông Bắc', E: 'Đông', SE: 'Đông Nam', S: 'Nam', SW: 'Tây Nam', W: 'Tây', NW: 'Tây Bắc' },
  placeWithArea: (area, country) => `${area}, ${country}`,
  cityState: 'Thành bang',
  countries: {
    BN: 'Brunei',
    KH: 'Campuchia',
    ID: 'Indonesia',
    LA: 'Lào',
    MY: 'Malaysia',
    MM: 'Myanmar',
    PH: 'Philippines',
    SG: 'Singapore',
    TH: 'Thái Lan',
    TL: 'Đông Timor',
    VN: 'Việt Nam'
  },
  areas: {
    'East Java': 'Đông Java',
    'North Sumatra': 'Bắc Sumatra',
    'Riau Islands': 'Quần đảo Riau',
    'South Sumatra': 'Nam Sumatra',
    'West Kalimantan': 'Tây Kalimantan',
    'Central Kalimantan': 'Trung Kalimantan',
    'South Kalimantan': 'Nam Kalimantan',
    'East Kalimantan': 'Đông Kalimantan'
  },
  cityNames: {
    hanoi: 'Hà Nội',
    'ho-chi-minh-city': 'TP. Hồ Chí Minh',
    bangkok: 'Băng Cốc',
    'phnom-penh': 'Phnôm Pênh',
    'siem-reap': 'Xiêm Riệp',
    vientiane: 'Viêng Chăn',
    'luang-prabang': 'Luông Pha Băng'
  }
};
