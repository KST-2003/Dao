<?php

namespace Database\Seeders;

use App\Models\MembershipTier;
use Illuminate\Database\Seeder;

/** Initial tiers. Placeholders — admins edit names, thresholds and benefits in the dashboard. */
class MembershipTierSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            ['code' => 'member', 'sort_order' => 0, 'min_points' => 0, 'min_spend' => 0, 'discount_percent' => 0, 'points_multiplier' => 1, 'color' => '#9EAD91', 'badge_icon' => 'lily',
                't' => [
                    'en' => ['name' => 'Member', 'description' => 'Welcome to DAO.', 'benefits' => ['Earn DAO Points on every order', 'Birthday reward', 'Member-only prices']],
                    'th' => ['name' => 'Member', 'description' => 'ยินดีต้อนรับสู่ DAO', 'benefits' => ['สะสมคะแนน DAO ทุกคำสั่งซื้อ', 'ของขวัญวันเกิด', 'ราคาพิเศษสำหรับสมาชิก']],
                    'my' => ['name' => 'Member', 'description' => 'DAO မှ ကြိုဆိုပါသည်။', 'benefits' => ['အော်ဒါတိုင်းတွင် DAO အမှတ်ရယူပါ', 'မွေးနေ့ဆု', 'အဖွဲ့ဝင်ဈေးနှုန်း']],
                ]],
            ['code' => 'vip', 'sort_order' => 10, 'min_points' => 5000, 'min_spend' => 0, 'discount_percent' => 5, 'points_multiplier' => 1.5, 'early_access' => true, 'color' => '#D9A5A5', 'badge_icon' => 'crown',
                't' => [
                    'en' => ['name' => 'VIP', 'description' => 'More benefits, more love.', 'benefits' => ['5% member discount', '1.5× DAO Points', 'Early access to new collections', 'Birthday reward']],
                    'th' => ['name' => 'VIP', 'description' => 'สิทธิพิเศษมากขึ้น', 'benefits' => ['ส่วนลดสมาชิก 5%', 'คะแนน DAO 1.5 เท่า', 'ช้อปคอลเลกชันใหม่ก่อนใคร', 'ของขวัญวันเกิด']],
                    'my' => ['name' => 'VIP', 'description' => 'အကျိုးခံစားခွင့် ပိုများ', 'benefits' => ['အဖွဲ့ဝင် လျှော့စျေး 5%', 'DAO အမှတ် 1.5 ဆ', 'စုစည်းမှုအသစ်များကို စောစီးစွာ', 'မွေးနေ့ဆု']],
                ]],
            ['code' => 'dao_star', 'sort_order' => 20, 'min_points' => 20000, 'min_spend' => 0, 'discount_percent' => 10, 'points_multiplier' => 2, 'early_access' => true, 'free_shipping' => true, 'priority_support' => true, 'allows_screenshots' => true, 'allows_video_download' => true, 'color' => '#C9A96E', 'badge_icon' => 'star',
                't' => [
                    'en' => ['name' => 'DAO STAR', 'description' => 'Our brightest stars.', 'benefits' => ['10% member discount', '2× DAO Points', 'Free standard shipping', 'VIP-only pieces', 'Priority support']],
                    'th' => ['name' => 'DAO STAR', 'description' => 'ดาวที่สว่างที่สุดของเรา', 'benefits' => ['ส่วนลดสมาชิก 10%', 'คะแนน DAO 2 เท่า', 'ส่งฟรีแบบมาตรฐาน', 'สินค้าเฉพาะ VIP', 'บริการลูกค้าแบบพิเศษ']],
                    'my' => ['name' => 'DAO STAR', 'description' => 'ကျွန်ုပ်တို့၏ အတောက်ပဆုံး ကြယ်များ', 'benefits' => ['အဖွဲ့ဝင် လျှော့စျေး 10%', 'DAO အမှတ် 2 ဆ', 'အခမဲ့ ပို့ဆောင်ခ', 'VIP သီးသန့် ပစ္စည်းများ', 'ဦးစားပေး ဝန်ဆောင်မှု']],
                ]],
        ];

        foreach ($tiers as $row) {
            $translations = $row['t'];
            unset($row['t']);
            $tier = MembershipTier::query()->firstOrCreate(['code' => $row['code']], $row);
            if ($tier->wasRecentlyCreated) {
                $tier->syncTranslations($translations);
            }
        }
    }
}
