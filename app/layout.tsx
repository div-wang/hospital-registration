import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "安康挂号｜北京医院预约挂号",
  description: "医院、医生、科室与号源一站查询的便捷医疗挂号服务。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
