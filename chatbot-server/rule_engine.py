import re
import unicodedata
from typing import Any, Dict, List, Optional


ChatContext = Dict[str, Any]
Product = Dict[str, Any]

CUSTOMER_TIERS = {
    "standard": {"name": "Khach Hang Thuong", "discount": 0},
    "silver": {"name": "Khach Hang Bac", "discount": 5},
    "gold": {"name": "Khach Hang Vang", "discount": 10},
    "platinum": {"name": "Khach Hang Kim Cuong", "discount": 15},
}

DELIVERY_OPTIONS = [
    {"name": "Giao Hang Tieu Chuan", "price": 25000, "estimatedDays": "3-5 ngay lam viec"},
    {"name": "Giao Hang Nhanh", "price": 50000, "estimatedDays": "1-2 ngay lam viec"},
    {"name": "Giao Trong Ngay", "price": 80000, "estimatedDays": "Trong ngay (khu vuc noi thanh)"},
    {"name": "Mien Phi Van Chuyen", "price": 0, "estimatedDays": "5-7 ngay lam viec (don tu 500.000d)"},
]

PAYMENT_METHODS = [
    "The Tin Dung/Ghi No",
    "MoMo",
    "Chuyen Khoan Ngan Hang",
    "Thanh Toan Khi Nhan Hang",
]

RULES: Dict[str, List[str]] = {
    "greeting": ["xin chao", "chao", "hello", "hi", "hey", "chao ban"],
    "product": ["san pham", "mat hang", "ban gi", "co gi", "danh muc", "nong san"],
    "price": ["gia", "bao nhieu", "price", "cost", "tien", "dat", "re", "gia ca"],
    "stock": ["con hang", "ton kho", "het hang", "so luong", "stock", "con khong"],
    "origin": ["xuat xu", "nguon goc", "o dau", "vung trong", "chung nhan", "vietgap", "globalgap", "organic", "huu co", "tu dau", "nong trai"],
    "storage": ["bao quan", "han su dung", "de duoc bao lau", "shelf", "storage", "giu tuoi", "cach giu"],
    "season": ["mua vu", "vao mua", "mua nao", "thu hoach", "season", "chinh vu"],
    "delivery": ["giao hang", "van chuyen", "ship", "delivery", "bao lau", "phi ship", "khung gio", "gio giao"],
    "payment": ["thanh toan", "payment", "tra tien", "cod", "momo", "chuyen khoan", "the", "vi dien tu"],
    "promotion": ["khuyen mai", "giam gia", "voucher", "ma giam", "uu dai", "coupon", "discount", "sale"],
    "tier": ["hang", "thanh vien", "bac", "vang", "kim cuong", "diem", "loyalty", "tich diem", "cap bac"],
    "cart": ["gio hang", "cart", "don hang", "mua hang", "dat hang"],
    "thanks": ["cam on", "thank", "thanks", "cam on ban"],
    "help": ["tro giup", "ho tro", "help", "tu van", "lien he", "hotline"],
    "compare": ["so sanh", "khac nhau", "nao ngon hon", "chon gi", "compare"],
    "recommend": ["goi y", "de xuat", "nen mua gi", "recommend", "pho bien", "ban chay", "ngon nhat"],
    "subscription": ["dinh ky", "dang ky", "combo tuan", "goi tuan", "subscription"],
    "order_status": ["trang thai don", "theo doi don", "don hang dau", "huy don", "tra hang"],
    "return_policy": ["doi tra", "hoan tien", "khieu nai", "chat luong", "hu hong", "dap nat"],
}

PRODUCT_ALIASES: Dict[str, List[str]] = {
    "1": ["gao", "rice", "st25"],
    "2": ["ca phe", "coffee", "robusta", "dak lak"],
    "3": ["thanh long", "dragon fruit"],
    "4": ["ho tieu", "tieu", "pepper", "phu quoc"],
    "5": ["chom chom", "rambutan"],
    "6": ["rau", "rau cu", "rau huu co", "vegetable", "organic"],
    "7": ["xoai", "mango", "hoa loc"],
    "8": ["nuoc mam", "fish sauce"],
    "9": ["lua mach", "ngu coc", "grain"],
    "10": ["mang kho", "mang", "specialty"],
    "11": ["tra xanh", "thai nguyen", "tea"],
    "12": ["buoi", "pomelo", "da xanh"],
}

AMBIGUOUS_PRODUCT_WORDS = {"tra"}


def normalize_text(value: str) -> str:
    stripped = unicodedata.normalize("NFD", value or "")
    stripped = "".join(ch for ch in stripped if unicodedata.category(ch) != "Mn")
    stripped = stripped.replace("đ", "d").replace("Đ", "D")
    stripped = re.sub(r"[^\w\s]", " ", stripped.lower(), flags=re.UNICODE)
    return re.sub(r"\s+", " ", stripped).strip()


def format_currency(value: float) -> str:
    return f"{round(value):,}".replace(",", ".") + "d"


def get_category_name(category: str) -> str:
    return (category or "").split("(")[0].strip()


def message_has_keyword(message: str, keyword: str) -> bool:
    normalized = normalize_text(keyword)
    if not normalized:
        return False
    return normalized in message if " " in normalized else normalized in message.split()


def detect_intent(message: str) -> Optional[str]:
    for intent, keywords in RULES.items():
        if any(message_has_keyword(message, keyword) for keyword in keywords):
            return intent
    return None


def get_product_keywords(product: Product) -> List[str]:
    product_text = f"{product.get('name', '')} {product.get('category', '')}"
    words = [
        word
        for word in normalize_text(product_text).split()
        if len(word) > 2 and word not in AMBIGUOUS_PRODUCT_WORDS
    ]
    aliases = [normalize_text(alias) for alias in PRODUCT_ALIASES.get(str(product.get("id", "")), [])]
    return words + aliases


def find_products_by_message(message: str, products: List[Product]) -> List[Product]:
    matches = []
    for product in products:
        product_name = normalize_text(product.get("name", ""))
        if product_name and product_name in message:
            matches.append(product)
            continue
        if any(keyword and len(keyword) >= 3 and keyword in message for keyword in get_product_keywords(product)):
            matches.append(product)
    return matches[:4]


def get_personalized_price(price: float, tier_key: str) -> float:
    tier = CUSTOMER_TIERS.get(tier_key, CUSTOMER_TIERS["standard"])
    return price * (1 - tier["discount"] / 100)


def format_product_summary(product: Product, personalized_price: float) -> str:
    certs = ", ".join(product.get("certification") or []) or "Chua cap nhat"
    lines = [
        f"**{product.get('name', 'San pham')}**",
        f"Gia: {format_currency(personalized_price)} / {product.get('unit') or 'san pham'}"
        + (f" (gia goc {format_currency(product.get('price', 0))})" if personalized_price < product.get("price", 0) else ""),
        f"Danh muc: {get_category_name(product.get('category', ''))} | Con: {product.get('stock', 0)}",
        f"Xuat xu: {product.get('origin') or 'Chua cap nhat'} | Chung nhan: {certs}",
    ]
    if product.get("isPerishable"):
        lines.append(f"Bao quan: {product.get('storageInstructions') or 'Tham khao bao bi'}")
    return "\n".join(lines)


def format_product_list(products: List[Product], tier_key: str) -> str:
    rows = []
    for index, product in enumerate(products[:5], start=1):
        price = get_personalized_price(float(product.get("price", 0)), tier_key)
        rows.append(
            f"{index}. {product.get('name', 'San pham')} - {format_currency(price)} / "
            f"{product.get('unit') or 'sp'} (rating {product.get('rating', 'N/A')})"
        )
    return "\n".join(rows)


def get_rule_response(user_message: str, context: Optional[ChatContext] = None) -> Dict[str, Any]:
    context = context or {}
    products = context.get("products") or []
    cart = context.get("cart") or []
    vouchers = context.get("vouchers") or []
    store_profile = context.get("storeProfile") or {}
    customer_tier = context.get("customerTier") or "standard"

    message = normalize_text(user_message)
    intent = detect_intent(message)
    matched_products = find_products_by_message(message, products)
    active_vouchers = [voucher for voucher in vouchers if voucher.get("isActive")]
    tier_info = CUSTOMER_TIERS.get(customer_tier, CUSTOMER_TIERS["standard"])

    if intent == "greeting":
        reply = "Chao ban! Toi co the giup ban tra cuu san pham, gia, nguon goc, giao hang, thanh toan, voucher va hang thanh vien."
    elif intent == "thanks":
        reply = "Rat vui duoc ho tro ban. Neu can them thong tin, cu nhan toi nhe."
    elif matched_products:
        product = matched_products[0]
        price = float(product.get("price", 0))
        personalized_price = get_personalized_price(price, customer_tier)
        if intent == "price":
            reply = (
                f"{product.get('name')}: {format_currency(personalized_price)} / {product.get('unit') or 'san pham'}\n"
                + (
                    f"Hang {tier_info['name']} giam {tier_info['discount']}% (gia goc {format_currency(price)})"
                    if tier_info["discount"] > 0
                    else "Gia chua bao gom VAT 10%"
                )
            )
        elif intent == "stock":
            stock_text = f"Con {product.get('stock', 0)} {product.get('unit') or 'san pham'}" if product.get("stock", 0) > 0 else "Tam het hang"
            reply = f"{product.get('name')}: {stock_text}"
            if product.get("isPerishable"):
                reply += "\nSan pham tuoi, nen dat som."
        elif intent == "origin":
            reply = "\n".join([
                f"{product.get('name')}",
                f"Xuat xu: {product.get('origin') or 'Chua cap nhat'}",
                f"Chung nhan: {', '.join(product.get('certification') or []) or 'Chua cap nhat'}",
                f"Ma lo: {product.get('batchCode') or 'N/A'}",
                f"Thu hoach: {product.get('harvestDate') or 'N/A'}",
            ])
        elif intent == "storage":
            reply = "\n".join([
                f"{product.get('name')}",
                f"Han su dung: {product.get('shelfLife') or 'Chua cap nhat'}",
                f"Bao quan: {product.get('storageInstructions') or 'Chua cap nhat'}",
            ])
        elif intent == "season":
            reply = f"{product.get('name')}: {product.get('season') or 'Chua cap nhat mua vu'}"
        elif len(matched_products) > 1:
            reply = (
                f"Tim thay {len(matched_products)} san pham lien quan:\n\n"
                + "\n\n".join(
                    format_product_summary(item, get_personalized_price(float(item.get("price", 0)), customer_tier))
                    for item in matched_products
                )
            )
        else:
            reply = format_product_summary(product, personalized_price)
    elif intent == "product":
        categories = sorted({get_category_name(product.get("category", "")) for product in products if product.get("category")})
        featured = sorted(products, key=lambda item: item.get("rating", 0), reverse=True)
        reply = f"Hien co {len(products)} san pham, nhom: {', '.join(categories)}\nNoi bat:\n{format_product_list(featured, customer_tier)}"
    elif intent == "price":
        reply = (
            f"Hang {tier_info['name']} duoc giam {tier_info['discount']}%.\n"
            f"Nhap ten san pham de xem gia, vi du: gia gao ST25.\n{format_product_list(products, customer_tier)}"
        )
    elif intent == "recommend":
        top_products = sorted(products, key=lambda item: item.get("rating", 0), reverse=True)
        reply = "San pham duoc yeu thich nhat:\n" + format_product_list(top_products, customer_tier)
    elif intent == "delivery":
        reply = "\n".join(
            ["Phuong thuc giao hang:"]
            + [f"- {option['name']}: {format_currency(option['price'])} - {option['estimatedDays']}" for option in DELIVERY_OPTIONS]
            + ["Khung gio: Sang (8-12h), Trua (12-15h), Chieu (15-18h), Toi (18-21h)"]
        )
    elif intent == "payment":
        reply = f"Thanh toan: {', '.join(PAYMENT_METHODS)}.\nGia chua bao gom VAT 10%."
    elif intent == "promotion":
        if active_vouchers:
            reply = "Voucher dang hoat dong:\n" + "\n".join(
                f"- {voucher.get('code')}: {voucher.get('description')} (don tu {format_currency(voucher.get('minOrderValue', 0))})"
                for voucher in active_vouchers[:6]
            )
        else:
            reply = "Hien chua co voucher. Uu dai hang thanh vien van ap dung tu dong."
    elif intent == "tier":
        reply = "\n".join([
            f"Hang hien tai: {tier_info['name']} (giam {tier_info['discount']}%)",
            "Moc thang hang:",
            "- Bac: tu 1.000.000d",
            "- Vang: tu 5.000.000d",
            "- Kim Cuong: tu 15.000.000d",
        ])
    elif intent == "cart":
        if not cart:
            reply = "Gio hang trong. Vao trang San Pham de mua sam nhe."
        else:
            total = sum(
                get_personalized_price(float(item.get("product", {}).get("price", 0)), customer_tier) * int(item.get("quantity", 0))
                for item in cart
            )
            reply = "\n".join(
                [f"Gio hang ({sum(int(item.get('quantity', 0)) for item in cart)} SP):"]
                + [
                    f"- {item.get('product', {}).get('name')} x{item.get('quantity')}: "
                    f"{format_currency(get_personalized_price(float(item.get('product', {}).get('price', 0)), customer_tier) * int(item.get('quantity', 0)))}"
                    for item in cart
                ]
                + [f"Tam tinh: {format_currency(total)} (chua VAT va ship)"]
            )
    elif intent == "subscription":
        reply = "Goi Dinh Ky cho phep nhan nong san tuoi tu dong theo tuan, 2 tuan hoac hang thang. Co the tam dung hoac huy bat ky luc nao."
    elif intent == "order_status":
        reply = "Don hang co cac trang thai: Cho xu ly -> Dang xu ly -> Dang giao -> Da giao. Co the huy trong 5 phut dau neu chua xu ly."
    elif intent == "return_policy":
        reply = (
            "Chinh sach doi tra: hang tuoi bi dap nat/hư hong se duoc hoan tien hoac doi tra. "
            f"Lien he: {store_profile.get('shopPhone') or '0912 345 678'}"
        )
    elif intent == "help":
        reply = "\n".join([
            f"Lien he: {store_profile.get('shopName') or 'Nong San Viet'}",
            f"Hotline: {store_profile.get('shopPhone') or '0912 345 678'}",
            f"Email: {store_profile.get('shopEmail') or 'seller@demo.com'}",
            "Hoac hoi toi ve san pham, gia, giao hang, thanh toan, voucher, hang thanh vien.",
        ])
    else:
        reply = (
            "Toi chua hieu ro y ban. Ban co the hoi ve san pham va gia, giao hang, thanh toan, "
            "voucher, bao quan, nguon goc hoac hang thanh vien."
        )

    return {
        "reply": reply,
        "sources": [],
        "mode": "rule",
        "confidence": 0.65 if intent else 0.0,
        "suggestions": [
            "Gia gao ST25 bao nhieu?",
            "Co voucher nao khong?",
            "Phi giao hang bao nhieu?",
        ],
    }
