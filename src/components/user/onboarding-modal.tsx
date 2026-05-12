"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Search, FileText, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "onboarding_seen_v1";

const STEPS = [
  {
    icon: Search,
    color: "bg-blue-50 text-blue-600",
    title: "瀏覽活動",
    desc: "探索韓國餐廳、景點、產品等各種體驗活動",
  },
  {
    icon: FileText,
    color: "bg-purple-50 text-purple-600",
    title: "提交申請",
    desc: "填寫社群媒體帳號，一鍵申請心儀活動",
  },
  {
    icon: CheckCircle,
    color: "bg-green-50 text-green-600",
    title: "等待選取",
    desc: "廣告主審核後通知結果，入選後安排體驗行程",
  },
  {
    icon: User,
    color: "bg-amber-50 text-amber-600",
    title: "完成體驗",
    desc: "到店體驗後發布後記，完成整個合作流程",
  },
];

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white shadow-md shadow-primary/20">
            天
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">歡迎使用天下！</h2>
            <p className="text-xs text-gray-400">韓國體驗團申請平台</p>
          </div>
        </div>

        <div className="mb-5 space-y-3">
          {STEPS.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5 rounded-xl border border-primary/10 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary">💡 申請更快速</p>
          <p className="mt-0.5 text-xs text-gray-500">
            事先填寫中文姓名、LINE ID、Instagram 等基本資料，申請時自動帶入，不必每次重新輸入。
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={dismiss} variant="outline" className="flex-1">
            先逛逛
          </Button>
          <Link href="/mypage" className="flex-1" onClick={dismiss}>
            <Button className="w-full">填寫我的資料</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
