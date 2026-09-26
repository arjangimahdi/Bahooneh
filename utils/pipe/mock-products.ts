import { ResultItem } from "./types";

export const MOCK_ITEMS: ResultItem[] = [
  {
    product: {
      id: 1,
      title: "اسپیکر بلوتوثی قابل حمل تراست مدل Zowy",
      price: 1_850_000,
      imageUrl: "https://picsum.photos/seed/speaker/400/400",
      partner: "digikala",
      available: true,
    },
    affiliateUrl: "https://www.digikala.com/product/dkp-1/",
    rationale: "چون عاشق موسیقی و پادکسته و می‌تونه هرجا با خودش ببرتش.",
  },
  {
    product: {
      id: 2,
      title: "پایه شارژ دسته پلی‌استیشن ۵",
      price: 890_000,
      imageUrl: "https://picsum.photos/seed/dualsense/400/400",
      partner: "digikala",
      available: true,
    },
    affiliateUrl: "https://www.digikala.com/product/dkp-2/",
    rationale: "چون پلی‌استیشن داره و یه جای مرتب برای شارژ دسته‌هاش می‌خواد.",
  },
  {
    product: {
      id: 3,
      title: "چراغ رومیزی RGB گیمینگ",
      price: 640_000,
      imageUrl: "https://picsum.photos/seed/rgblamp/400/400",
      partner: "snapshop",
      available: true,
    },
    affiliateUrl: "https://snapp.shop/product/3",
    rationale: "چون فضای بازیش رو باحال‌تر می‌کنه و با حال‌وهوای شوخ تولد جوره.",
  },
  {
    product: {
      id: 4,
      title: "ایرفرایر کوچک ۳ لیتری",
      price: 2_450_000,
      imageUrl: "https://picsum.photos/seed/airfryer/400/400",
      partner: "digikala",
      available: true,
    },
    affiliateUrl: "https://www.digikala.com/product/dkp-4/",
    rationale: "چون تازه مستقل شده و آشپزی سریع براش کاربردیه.",
  },
  {
    product: {
      id: 5,
      title: "کارت گیفت ۲۰ دلاری پلی‌استیشن استور",
      price: 1_300_000,
      imageUrl: "https://picsum.photos/seed/giftcard/400/400",
      partner: "snapshop",
      available: false,
    },
    affiliateUrl: "https://snapp.shop/product/5",
    rationale: "چون خودش بازی‌ای که دوست داره رو انتخاب می‌کنه.",
  },
];
