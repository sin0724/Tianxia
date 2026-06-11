import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { BottomTabBar } from "@/components/shared/bottom-tab-bar";
import { OnboardingModal } from "@/components/user/onboarding-modal";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userProp = user ? { id: user.id, email: user.email || "" } : null;

  let actionCount = 0;
  if (user) {
    const [{ count: stepCount }, { count: rejectedReviewCount }] = await Promise.all([
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["approved", "scheduled"]),
      // 반려된 후기 (재제출 필요)
      supabase
        .from("reviews")
        .select("id, applications!inner(user_id)", { count: "exact", head: true })
        .eq("applications.user_id", user.id)
        .eq("status", "rejected"),
    ]);
    actionCount = (stepCount ?? 0) + (rejectedReviewCount ?? 0);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={userProp} actionCount={actionCount} />
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      <div className="pb-14 md:pb-0">
        <Footer />
      </div>
      <BottomTabBar user={userProp} actionCount={actionCount} />
      {user && <OnboardingModal />}
    </div>
  );
}
