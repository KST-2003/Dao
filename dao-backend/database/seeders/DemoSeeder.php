<?php

namespace Database\Seeders;

use App\Enums\BannerPlacement;
use App\Enums\ContentType;
use App\Enums\CouponScope;
use App\Enums\CouponType;
use App\Enums\Difficulty;
use App\Enums\ProductStatus;
use App\Enums\PublishStatus;
use App\Enums\RewardType;
use App\Models\Banner;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Reward;
use App\Models\Video;
use Illuminate\Database\Seeder;

/**
 * DEMO DATA for local development and design review only (never runs in production).
 * Images are placeholder photos (picsum.photos) — replace with real DAO photography.
 */
class DemoSeeder extends Seeder
{
    private function img(string $seed, int $w = 900, int $h = 1200): string
    {
        return "https://picsum.photos/seed/dao-{$seed}/{$w}/{$h}";
    }

    public function run(): void
    {
        if (Product::query()->exists()) {
            $this->command?->info('Demo data already present — skipping.');

            return;
        }

        $cat = fn (string $slug) => Category::query()->where('slug', $slug)->value('id');

        $products = [
            ['linen-maxi-dress', 'dresses', 59000, null, 55000, ['new', 'dao_pick'], 'Linen Maxi Dress', 'เดรสลินินยาว', 'လင်နင် ဂါဝန်ရှည်', [['Beige', '#E8DCC8'], ['Sage', '#9EAD91']], ['S', 'M', 'L', 'XL']],
            ['silk-wrap-blouse', 'tops', 45000, 39000, null, ['sale'], 'Silk Wrap Blouse', 'เสื้อไหมผูกเอว', 'ပိုးထည် အင်္ကျီ', [['Ivory', '#FFF9F1'], ['Rose', '#D9A5A5']], ['S', 'M', 'L']],
            ['pleated-midi-skirt', 'bottoms', 42000, null, null, ['new'], 'Pleated Midi Skirt', 'กระโปรงพลีทมิดี้', 'ခေါက်ချိုး စကတ်', [['Cocoa', '#5C493F'], ['Cream', '#F4EBDD']], ['S', 'M', 'L']],
            ['cotton-lounge-set', 'sets', 69000, null, 65000, ['bestseller'], 'Cotton Lounge Set', 'ชุดเซ็ตผ้าฝ้าย', 'ချည်ထည် အစုံ', [['Sage', '#9EAD91']], ['S', 'M', 'L']],
            ['shoulder-bag', 'bags', 45000, null, null, ['dao_pick'], 'Shoulder Bag', 'กระเป๋าสะพายไหล่', 'ပခုံးလွယ်အိတ်', [['Cream', '#F4EBDD'], ['Cocoa', '#5C493F']], [null]],
            ['lily-gold-earrings', 'accessories', 29000, null, null, ['limited'], 'Lily Gold Earrings', 'ต่างหูลิลลี่ทอง', 'လီလီ ရွှေနားကပ်', [['Gold', '#C9A96E']], [null]],
            ['evening-satin-dress', 'dresses', 129000, null, null, ['vip', 'limited'], 'Evening Satin Dress', 'เดรสซาตินออกงาน', 'ညနေခင်း ဆာတင် ဂါဝန်', [['Midnight', '#171917']], ['S', 'M', 'L'], true],
            ['linen-shirt', 'tops', 39000, null, null, ['new'], 'Relaxed Linen Shirt', 'เสื้อเชิ้ตลินิน', 'လင်နင် ရှပ်အင်္ကျီ', [['White', '#FFFFFF'], ['Sage', '#9EAD91']], ['S', 'M', 'L', 'XL']],
        ];

        $made = [];
        foreach ($products as $i => $p) {
            [$slug, $category, $price, $sale, $member, $badges, $en, $th, $my, $colors, $sizes] = $p;
            $product = Product::query()->create([
                'category_id' => $cat($category), 'slug' => $slug, 'brand' => 'DAO', 'sku' => strtoupper('DAO-'.substr(md5($slug), 0, 6)),
                'currency' => 'THB', 'price' => $price, 'sale_price' => $sale, 'member_price' => $member, 'weight_grams' => 400,
                'status' => ProductStatus::Published, 'badges' => $badges, 'is_vip_only' => $p[11] ?? false, 'published_at' => now()->subDays($i),
            ]);
            $product->syncTranslations([
                'en' => ['name' => $en, 'description' => 'Soft, breathable and made to move with you. Designed by Dao for warm days and easy evenings.', 'materials' => '100% natural fibres', 'care_instructions' => 'Hand wash cold. Dry in shade.', 'shipping_info' => 'Ships in 1–2 business days.'],
                'th' => ['name' => $th, 'description' => 'เนื้อผ้านุ่ม ระบายอากาศดี ออกแบบโดยดาวสำหรับวันสบาย ๆ', 'materials' => 'เส้นใยธรรมชาติ 100%', 'care_instructions' => 'ซักมือด้วยน้ำเย็น ตากในที่ร่ม', 'shipping_info' => 'จัดส่งภายใน 1–2 วันทำการ'],
                'my' => ['name' => $my, 'description' => 'နူးညံ့ပြီး လေဝင်လေထွက်ကောင်းသည်။ Dao မှ ဒီဇိုင်းထုတ်ထားသည်။'],
            ]);
            foreach ([0, 1, 2] as $n) {
                $product->images()->create(['url' => $this->img("{$slug}-{$n}"), 'thumbnail_url' => $this->img("{$slug}-{$n}", 480, 640), 'sort_order' => $n, 'color' => $n === 0 ? $colors[0][0] : null]);
            }
            $k = 0;
            foreach ($colors as [$color, $hex]) {
                foreach ($sizes as $size) {
                    $product->variants()->create([
                        'sku' => strtoupper('DAO-'.substr(md5($slug), 0, 6).'-'.substr($color, 0, 3).($size ? '-'.$size : '')),
                        'size' => $size, 'color' => $color, 'color_hex' => $hex,
                        'stock_quantity' => [8, 4, 2, 0, 12][$k % 5], 'sort_order' => $k++,
                    ]);
                }
            }
            $made[$slug] = $product;
        }

        $collections = [
            ['new-season', true, 'New Season', 'ฤดูกาลใหม่', 'ရာသီသစ်', 'DAO EDIT', array_keys($made)],
            ['daos-picks', false, "Dao's Picks", 'ดาวเลือกให้', 'Dao ရွေးချယ်မှု', 'Handpicked with love', ['linen-maxi-dress', 'shoulder-bag', 'lily-gold-earrings']],
            ['dao-essentials', false, 'DAO Essentials', 'ของต้องมี DAO', 'DAO မရှိမဖြစ်', 'Everyday pieces', ['linen-shirt', 'cotton-lounge-set', 'pleated-midi-skirt']],
        ];
        foreach ($collections as $i => [$slug, $featured, $en, $th, $my, $sub, $items]) {
            $c = Collection::query()->create(['slug' => $slug, 'hero_image_url' => $this->img("col-{$slug}", 1200, 800), 'sort_order' => $i, 'is_published' => true, 'is_featured' => $featured]);
            $c->syncTranslations(['en' => ['name' => $en, 'subtitle' => $sub], 'th' => ['name' => $th], 'my' => ['name' => $my]]);
            $c->products()->sync(collect($items)->values()->mapWithKeys(fn ($s, $n) => [$made[$s]->id => ['sort_order' => $n]])->all());
        }

        $hero = Banner::query()->create(['placement' => BannerPlacement::HomeHero, 'image_url' => $this->img('hero', 1200, 1500), 'link_type' => 'collection', 'link_value' => 'new-season', 'sort_order' => 0, 'is_active' => true]);
        $hero->syncTranslations([
            'en' => ['eyebrow' => 'New Season', 'title' => 'DAO EDIT', 'subtitle' => 'Discover the latest collection.', 'cta_label' => 'Shop now'],
            'th' => ['eyebrow' => 'คอลเลกชันใหม่', 'title' => 'DAO EDIT', 'subtitle' => 'ค้นพบคอลเลกชันล่าสุด', 'cta_label' => 'ช้อปเลย'],
            'my' => ['eyebrow' => 'ရာသီသစ်', 'title' => 'DAO EDIT', 'subtitle' => 'နောက်ဆုံး စုစည်းမှုကို ရှာဖွေပါ။', 'cta_label' => 'ယခုဝယ်ပါ'],
        ]);

        $vlog = Video::query()->create([
            'content_type' => ContentType::Vlog, 'category' => 'daos_life', 'slug' => 'a-slow-sunday-with-dao',
            'thumbnail_url' => $this->img('vlog-1', 900, 1600), 'video_url' => null, 'duration_seconds' => 482,
            'status' => PublishStatus::Published, 'published_at' => now()->subHours(2), 'view_count' => 2400, 'like_count' => 182,
        ]);
        $vlog->syncTranslations([
            'en' => ['title' => 'A slow Sunday with Dao', 'description' => 'Market, linen and a little cooking.'],
            'th' => ['title' => 'วันอาทิตย์สบาย ๆ กับดาว', 'description' => 'เดินตลาด ผ้าลินิน และทำอาหารนิดหน่อย'],
        ]);
        $vlog->products()->sync([$made['linen-maxi-dress']->id => ['sort_order' => 0], $made['shoulder-bag']->id => ['sort_order' => 1]]);

        $recipes = [
            ['green-curry', 'curry', 'Green Curry', 'แกงเขียวหวาน', 'အစိမ်းရောင် ဟင်း', 2, true],
            ['tom-yum', 'soup', 'Tom Yum', 'ต้มยำกุ้ง', 'တုံယမ်း', 3, true],
            ['pad-kra-pao', 'homemade', 'Pad Kra Pao', 'ผัดกะเพรา', 'ပဒ်ကရာပေါင်', 2, false],
            ['massaman-curry', 'curry', 'Massaman Curry', 'แกงมัสมั่น', 'မတ်စမန် ဟင်း', 1, false],
        ];
        foreach ($recipes as $i => [$slug, $category, $en, $th, $my, $spice, $featured]) {
            $video = Video::query()->create([
                'content_type' => ContentType::Recipe, 'category' => 'food', 'slug' => "how-dao-makes-{$slug}",
                'thumbnail_url' => $this->img("rv-{$slug}", 900, 1600), 'duration_seconds' => 360,
                'status' => PublishStatus::Published, 'published_at' => now()->subDays($i + 1),
            ]);
            $video->syncTranslations(['en' => ['title' => "How Dao makes {$en}"], 'th' => ['title' => "ดาวสอนทำ{$th}"]]);

            $recipe = Recipe::query()->create([
                'video_id' => $video->id, 'slug' => $slug, 'category' => $category, 'cover_image_url' => $this->img("recipe-{$slug}", 1000, 800),
                'prep_minutes' => 15, 'cook_minutes' => 25, 'servings' => 2, 'difficulty' => Difficulty::Easy, 'spice_level' => $spice,
                'is_featured' => $featured, 'status' => PublishStatus::Published, 'published_at' => now()->subDays($i + 1),
            ]);
            $recipe->syncTranslations([
                'en' => ['title' => $en, 'description' => 'Homemade the way Dao cooks it at home.'],
                'th' => ['title' => $th, 'description' => 'สูตรทำเองที่บ้านแบบฉบับดาว'],
                'my' => ['title' => $my],
            ]);
            foreach ([['Coconut milk', 'กะทิ', '400', 'ml'], ['Curry paste', 'พริกแกง', '2', 'tbsp'], ['Chicken or tofu', 'ไก่หรือเต้าหู้', '300', 'g'], ['Thai basil', 'ใบโหระพา', '1', 'handful']] as $n => [$ien, $ith, $q, $u]) {
                $recipe->ingredients()->create(['name' => ['en' => $ien, 'th' => $ith], 'quantity' => $q, 'unit' => $u, 'sort_order' => $n]);
            }
            foreach ([['Fry the paste in a little coconut cream until fragrant.', 'ผัดพริกแกงกับหัวกะทิจนหอม'], ['Add the protein and cook through.', 'ใส่เนื้อสัตว์ ผัดจนสุก'], ['Pour in coconut milk, season, simmer 10 minutes. Finish with basil.', 'เติมกะทิ ปรุงรส เคี่ยว 10 นาที ใส่โหระพา']] as $n => [$sen, $sth]) {
                $recipe->steps()->create(['step_number' => $n + 1, 'instruction' => ['en' => $sen, 'th' => $sth]]);
            }
        }

        $reward = Reward::query()->create(['code' => 'THB50', 'type' => RewardType::DiscountCoupon, 'points_cost' => 500, 'value' => 5000, 'value_type' => 'fixed', 'min_subtotal' => 50000, 'is_active' => true]);
        $reward->syncTranslations(['en' => ['name' => '฿50 off your next order'], 'th' => ['name' => 'ส่วนลด ฿50 สำหรับคำสั่งซื้อถัดไป'], 'my' => ['name' => 'နောက်အော်ဒါ ฿50 လျှော့']]);
        $ship = Reward::query()->create(['code' => 'FREESHIP', 'type' => RewardType::FreeShipping, 'points_cost' => 300, 'value' => 0, 'is_active' => true]);
        $ship->syncTranslations(['en' => ['name' => 'Free shipping'], 'th' => ['name' => 'ส่งฟรี'], 'my' => ['name' => 'အခမဲ့ ပို့ဆောင်']]);

        Coupon::query()->create(['code' => 'WELCOME10', 'type' => CouponType::Percentage, 'value' => 10, 'max_discount' => 20000, 'min_subtotal' => 50000, 'scope' => CouponScope::All, 'usage_limit_per_user' => 1, 'description' => '10% off your first order', 'is_active' => true]);
    }
}
