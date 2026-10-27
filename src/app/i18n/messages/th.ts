import type { Messages } from './en';

/** ไทย */
export const th: Messages = {
  appName: 'Haze Watch',
  tagline: 'คุณภาพอากาศเอเชียตะวันออกเฉียงใต้',
  pageTitle: 'Haze Watch · คุณภาพอากาศเอเชียตะวันออกเฉียงใต้',
  cityPageTitle: (city, aqi, category) => `${city}: US AQI ${aqi} (${category}) · Haze Watch`,
  skipToContent: 'ข้ามไปยังเนื้อหาหลัก',
  language: 'ภาษา',
  refresh: 'รีเฟรช',
  dataFor: 'ข้อมูลเวลา',
  checked: time => `ตรวจสอบเมื่อ ${time}`,
  loadingReadings: 'กำลังโหลดค่าตรวจวัด…',
  tryAgain: 'ลองอีกครั้ง',
  noData: 'ไม่มีข้อมูล',

  loadErrorTitle: 'โหลดค่าล่าสุดไม่สำเร็จ',
  showingReadingsFor: time => `กำลังแสดงค่าของเวลา ${time}`,
  errors: {
    offline: 'เชื่อมต่อบริการคุณภาพอากาศไม่ได้ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง',
    rateLimited: 'บริการคุณภาพอากาศกำลังจำกัดจำนวนคำขอ โปรดลองใหม่ในอีกไม่กี่นาที',
    api: detail => `บริการคุณภาพอากาศแจ้งข้อผิดพลาด: ${detail}`,
    unexpected: 'เกิดข้อผิดพลาดขณะโหลดข้อมูลคุณภาพอากาศ'
  },

  overviewLabel: 'ภาพรวมภูมิภาค',
  overviewMeta: cities => `${cities} เมือง · US AQI`,
  worstRightNow: 'แย่ที่สุดขณะนี้:',
  loadingOverview: cities => `กำลังโหลดค่าล่าสุดของ ${cities} เมือง…`,
  readingsUnavailable: 'ไม่มีข้อมูลคุณภาพอากาศในขณะนี้',
  headlineNone: 'ยังไม่มีค่าตรวจวัดในขณะนี้',
  headlineUnhealthy: (n, total) => `อากาศมีผลต่อสุขภาพใน ${n} จาก ${total} เมือง`,
  headlineSensitive: (n, total) => `อากาศมีผลต่อกลุ่มเสี่ยงใน ${n} จาก ${total} เมือง`,
  headlineClear: total => `อากาศดีหรือปานกลางทั้ง ${total} เมือง`,
  legendLabel: 'จำนวนเมืองในแต่ละระดับ US AQI',
  cityCount: () => ' เมือง',

  mapTitle: 'แผนที่ · US AQI รายเมือง',
  mapLabel: 'แผนที่ US AQI รายเมือง',
  mapLoading: 'กำลังโหลดแผนที่…',
  mapHint: 'หมุดแสดงค่า US AQI เลือกหมุดหรือเมืองในรายการเพื่อดูรายละเอียดและพยากรณ์ 4 วัน',
  mapAttribution: 'แผนที่ฐาน',

  selectedCity: 'เมืองที่เลือก',
  modelEstimate: time =>
    `ค่าประมาณจากแบบจำลองสำหรับ ${time} ค่า AQI คำนวณจากค่าเฉลี่ยฝุ่นละอองใน 24 ชั่วโมงที่ผ่านมา จึงอาจยังสูงอยู่ระยะหนึ่งหลังอากาศดีขึ้น`,
  healthAdvice: 'คำแนะนำด้านสุขภาพ',
  pm25ThisHour: 'PM2.5 ชั่วโมงนี้',
  whoGuideline: value => `ค่าแนะนำ 24 ชั่วโมงของ WHO: ${value}`,
  haze: 'หมอกควัน',
  aerosolOpticalDepth: value => `ความลึกเชิงแสงของละอองลอย ${value}`,
  wind: 'ลม',
  windNote: 'ลูกศรแสดงทิศที่ควันกำลังลอยไป',
  windUnavailable: 'ไม่มีข้อมูล',
  windCalm: 'ลมสงบ',
  windFrom: (kmh, direction) => `${kmh} กม./ชม. จากทิศ${direction}`,
  ozone: 'โอโซน',
  carbonMonoxide: 'คาร์บอนมอนอกไซด์',
  noReading: 'ขณะนี้ไม่มีค่าตรวจวัดของเมืองนี้',

  dailyOutlook: 'แนวโน้มรายวัน',
  localTimeIn: city => `เวลาท้องถิ่น${city}`,
  day: 'วัน',
  peakUsAqi: 'US AQI สูงสุด',
  peakPm25: 'PM2.5 สูงสุด',
  today: 'วันนี้',
  tomorrow: 'พรุ่งนี้',
  forecastError: 'โหลดพยากรณ์ไม่สำเร็จ',

  chartTitle: 'US AQI รายชั่วโมง',
  chartRange: 'ย้อนหลัง 2 วันและพยากรณ์ 4 วัน',
  chartAriaTitle: 'แผนภูมิ US AQI รายชั่วโมง',
  chartNow: reading => `ขณะนี้ ${reading}`,
  chartForecastPeak: (reading, when) => `ค่าสูงสุดที่พยากรณ์ ${reading} เมื่อ ${when}`,
  chartNowLabel: 'ตอนนี้',
  chartPeakLabel: (aqi, when) => `สูงสุด ${aqi} · ${when}`,
  chartHint: 'ชี้ที่แผนภูมิเพื่ออ่านค่ารายชั่วโมง',
  chartKeyHistory: 'ค่าย้อนหลังจากแบบจำลอง',
  chartKeyForecast: 'พยากรณ์',
  chartKeyPeak: 'ค่าสูงสุดที่พยากรณ์',
  chartEmpty: 'ข้อมูลรายชั่วโมงของเมืองนี้ไม่เพียงพอสำหรับวาดแผนภูมิ',

  citiesHeading: 'เมือง',
  country: 'ประเทศ',
  allCountries: 'ทุกประเทศ',
  sort: 'เรียงลำดับ',
  sortWorst: 'อากาศแย่ที่สุดก่อน',
  sortBest: 'อากาศดีที่สุดก่อน',
  sortName: 'ชื่อ (ก–ฮ)',
  listSummary: (n, country, order) =>
    `${country ? `${n} เมืองใน${country}` : `${n} เมือง`} · ${{ worst: 'อากาศแย่ที่สุดก่อน', best: 'อากาศดีที่สุดก่อน', name: 'เรียงตามชื่อ' }[order]}`,
  noCitiesMatch: 'ไม่มีเมืองที่ตรงกับตัวกรองนี้',

  showing: (city, aqi, category) => `กำลังแสดง${city}: US AQI ${aqi} ระดับ${category}`,
  showingNoData: city => `กำลังแสดง${city}`,

  aboutHeading: 'เกี่ยวกับข้อมูลนี้',
  aboutModelBefore: 'ค่าที่แสดงเป็น',
  aboutModelStrong: 'ค่าประมาณจากแบบจำลอง',
  aboutModelAfter:
    'ของ Copernicus Atmosphere Monitoring Service (CAMS) ให้บริการโดย Open-Meteo บนตารางกริดขนาดประมาณ 45 กม. แสดงภาพควันระดับภูมิภาคได้ดี แต่อาจต่างจากสถานีตรวจวัดภาคพื้นดิน โดยเฉพาะใกล้จุดไฟหรือในใจกลางเมืองที่หนาแน่น ระหว่างที่เปิดหน้านี้ ระบบจะดึงค่าใหม่หลังต้นชั่วโมงไม่นาน',
  aboutIndex:
    'ค่าที่แสดงใช้ดัชนีคุณภาพอากาศของ EPA สหรัฐฯ ดัชนีของแต่ละประเทศคำนวณต่างกัน ค่า PSI ของสิงคโปร์ API ของมาเลเซีย และ ISPU ของอินโดนีเซียจึงไม่ตรงกับตัวเลขเหล่านี้ทุกประการ',
  sourcesHeading: 'ค่าตรวจวัดและประกาศอย่างเป็นทางการ',
  sources: {
    sg: 'สิงคโปร์: ข้อมูลหมอกควันจาก NEA',
    my: 'มาเลเซีย: ดัชนีมลพิษทางอากาศ (APIMS)',
    id: 'อินโดนีเซีย: ดัชนีมาตรฐานมลพิษทางอากาศ (ISPU)',
    th: 'ไทย: Air4Thai',
    asmc: 'ศูนย์อุตุนิยมวิทยาเฉพาะทางอาเซียน: หมอกควันและจุดความร้อนในภูมิภาค',
    firms: 'NASA FIRMS: แผนที่จุดไฟ'
  },
  footerDataBefore: 'ข้อมูลคุณภาพอากาศและลมจาก ',
  footerDataAfter:
    ' (CC BY 4.0) สร้างโดยใช้ข้อมูลของ Copernicus Atmosphere Monitoring Service ข้อมูลแผนที่ © ผู้ร่วมพัฒนา OpenStreetMap',
  footerDisclaimer: 'ไม่ใช่ประกาศอย่างเป็นทางการ โปรดปฏิบัติตามคำแนะนำของหน่วยงานในพื้นที่',

  categories: {
    good: { label: 'ดี', short: 'ดี', advice: 'คุณภาพอากาศอยู่ในเกณฑ์ดี ทำกิจกรรมกลางแจ้งได้ตามปกติ' },
    moderate: {
      label: 'ปานกลาง',
      short: 'ปานกลาง',
      advice: 'ยอมรับได้สำหรับคนส่วนใหญ่ หากคุณไวต่อมลพิษทางอากาศเป็นพิเศษ ควรลดเวลาหรือความหนักของกิจกรรมกลางแจ้ง'
    },
    sensitive: {
      label: 'มีผลต่อกลุ่มเสี่ยง',
      short: 'กลุ่มเสี่ยง',
      advice: 'เด็ก ผู้สูงอายุ หญิงตั้งครรภ์ และผู้มีโรคหัวใจหรือโรคปอด ควรลดกิจกรรมกลางแจ้งที่ใช้เวลานานหรือใช้แรงมาก'
    },
    unhealthy: {
      label: 'มีผลต่อสุขภาพ',
      short: 'มีผลต่อสุขภาพ',
      advice:
        'ทุกคนควรลดกิจกรรมกลางแจ้งที่ใช้เวลานานหรือใช้แรงมาก กลุ่มเสี่ยงควรงดกิจกรรมดังกล่าว หากจำเป็นต้องอยู่กลางแจ้งนาน ควรสวมหน้ากาก N95 ที่กระชับใบหน้า'
    },
    'very-unhealthy': {
      label: 'มีผลต่อสุขภาพมาก',
      short: 'มีผลต่อสุขภาพมาก',
      advice:
        'ทุกคนควรงดกิจกรรมกลางแจ้งที่ใช้เวลานานหรือใช้แรงมาก กลุ่มเสี่ยงควรอยู่ในอาคาร ปิดหน้าต่าง และเปิดเครื่องฟอกอากาศหากทำได้'
    },
    hazardous: {
      label: 'อันตราย',
      short: 'อันตราย',
      advice: 'ทุกคนควรงดกิจกรรมทางกายกลางแจ้งทั้งหมด และอยู่ในอาคารโดยปิดหน้าต่าง ปฏิบัติตามคำแนะนำของหน่วยงานสาธารณสุขในพื้นที่'
    }
  },
  hazeLevels: { clear: 'ท้องฟ้าใส', light: 'หมอกควันบาง', hazy: 'มีหมอกควัน', thick: 'หมอกควันหนา' },
  compass: {
    N: 'เหนือ',
    NE: 'ตะวันออกเฉียงเหนือ',
    E: 'ตะวันออก',
    SE: 'ตะวันออกเฉียงใต้',
    S: 'ใต้',
    SW: 'ตะวันตกเฉียงใต้',
    W: 'ตะวันตก',
    NW: 'ตะวันตกเฉียงเหนือ'
  },
  placeWithArea: (area, country) => `${area} ${country}`,
  cityState: 'นครรัฐ',
  countries: {
    BN: 'บรูไน',
    KH: 'กัมพูชา',
    ID: 'อินโดนีเซีย',
    LA: 'ลาว',
    MY: 'มาเลเซีย',
    MM: 'เมียนมา',
    PH: 'ฟิลิปปินส์',
    SG: 'สิงคโปร์',
    TH: 'ไทย',
    TL: 'ติมอร์-เลสเต',
    VN: 'เวียดนาม'
  },
  areas: {
    Johor: 'ยะโฮร์',
    Perak: 'เประ',
    Penang: 'ปีนัง',
    Pahang: 'ปะหัง',
    Sarawak: 'ซาราวัก',
    Sabah: 'ซาบาห์',
    'East Java': 'ชวาตะวันออก',
    'North Sumatra': 'สุมาตราเหนือ',
    Riau: 'เรียว',
    'Riau Islands': 'หมู่เกาะเรียว',
    Jambi: 'จัมบี',
    'South Sumatra': 'สุมาตราใต้',
    'West Kalimantan': 'กาลีมันตันตะวันตก',
    'Central Kalimantan': 'กาลีมันตันกลาง',
    'South Kalimantan': 'กาลีมันตันใต้',
    'East Kalimantan': 'กาลีมันตันตะวันออก',
    Songkhla: 'สงขลา'
  },
  cityNames: {
    singapore: 'สิงคโปร์',
    'kuala-lumpur': 'กัวลาลัมเปอร์',
    'johor-bahru': 'ยะโฮร์บาห์รู',
    melaka: 'มะละกา',
    ipoh: 'อีโปห์',
    'george-town': 'จอร์จทาวน์',
    kuantan: 'กวนตัน',
    kuching: 'กูชิง',
    miri: 'มีรี',
    'kota-kinabalu': 'โกตากินาบาลู',
    jakarta: 'จาการ์ตา',
    surabaya: 'สุราบายา',
    medan: 'เมดาน',
    pekanbaru: 'เปอกันบารู',
    batam: 'บาตัม',
    jambi: 'จัมบี',
    palembang: 'ปาเล็มบัง',
    pontianak: 'ปนเตียนัก',
    'palangka-raya': 'ปาลังการายา',
    banjarmasin: 'บันจาร์มาซิน',
    samarinda: 'ซามารินดา',
    bangkok: 'กรุงเทพฯ',
    'chiang-mai': 'เชียงใหม่',
    'chiang-rai': 'เชียงราย',
    'khon-kaen': 'ขอนแก่น',
    'hat-yai': 'หาดใหญ่',
    'bandar-seri-begawan': 'บันดาร์เสรีเบกาวัน',
    'phnom-penh': 'พนมเปญ',
    'siem-reap': 'เสียมเรียบ',
    vientiane: 'เวียงจันทน์',
    'luang-prabang': 'หลวงพระบาง',
    yangon: 'ย่างกุ้ง',
    mandalay: 'มัณฑะเลย์',
    hanoi: 'ฮานอย',
    'ho-chi-minh-city': 'นครโฮจิมินห์',
    manila: 'มะนิลา',
    cebu: 'เซบู',
    davao: 'ดาเวา',
    dili: 'ดิลี'
  }
};
