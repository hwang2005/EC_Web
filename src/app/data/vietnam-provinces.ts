/**
 * Dữ liệu địa giới hành chính Việt Nam
 * Lấy từ API: https://provinces.open-api.vn/api/v2/
 *
 * Mô hình 2 cấp: Tỉnh/Thành phố → Phường/Xã
 */

export interface Ward {
  code: number;
  name: string;
}

export interface Province {
  code: number;
  name: string;
  division_type: string;
}

const API_BASE = "https://provinces.open-api.vn/api/v2";

/** Cache để tránh gọi API lặp lại */
let provincesCache: Province[] | null = null;
const wardsCache: Map<number, Ward[]> = new Map();

/**
 * Lấy danh sách tỉnh/thành phố từ API
 * Kết quả được cache sau lần gọi đầu tiên
 */
export async function fetchProvinces(): Promise<Province[]> {
  if (provincesCache) return provincesCache;

  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error("Không thể tải danh sách tỉnh/thành phố");

  const data: Province[] = await res.json();
  provincesCache = data.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return provincesCache;
}

/**
 * Lấy danh sách phường/xã theo mã tỉnh/thành phố từ API
 * Kết quả được cache sau lần gọi đầu tiên cho mỗi tỉnh
 */
export async function fetchWardsByProvinceCode(provinceCode: number): Promise<Ward[]> {
  if (wardsCache.has(provinceCode)) return wardsCache.get(provinceCode)!;

  const res = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
  if (!res.ok) throw new Error("Không thể tải danh sách phường/xã");

  const data = await res.json();
  const wards: Ward[] = (data.wards || [])
    .map((w: any) => ({ code: w.code, name: w.name }))
    .sort((a: Ward, b: Ward) => a.name.localeCompare(b.name, "vi"));

  wardsCache.set(provinceCode, wards);
  return wards;
}

/**
 * Helper: Kiểm tra tỉnh có thuộc vùng TP.HCM mở rộng không
 */
export function isHCMCArea(provinceName: string): boolean {
  return provinceName === "Thành phố Hồ Chí Minh";
}
