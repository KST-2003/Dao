<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'new-in' => ['New In', 'มาใหม่', 'အသစ်ရောက်'],
            'dresses' => ['Dresses', 'เดรส', 'ဂါဝန်'],
            'tops' => ['Tops', 'เสื้อ', 'အပေါ်ဝတ်'],
            'bottoms' => ['Bottoms', 'กางเกง & กระโปรง', 'အောက်ဝတ်'],
            'sets' => ['Sets', 'ชุดเซ็ต', 'အစုံ'],
            'outerwear' => ['Outerwear', 'เสื้อคลุม', 'အပေါ်ထပ်ဝတ်'],
            'accessories' => ['Accessories', 'เครื่องประดับ', 'ဆက်စပ်ပစ္စည်း'],
            'bags' => ['Bags', 'กระเป๋า', 'အိတ်'],
            'shoes' => ['Shoes', 'รองเท้า', 'ဖိနပ်'],
            'beauty' => ['Beauty', 'บิวตี้', 'အလှအပ'],
            'lifestyle' => ['Lifestyle', 'ไลฟ์สไตล์', 'လူနေမှုပုံစံ'],
            'home' => ['Home', 'ของแต่งบ้าน', 'အိမ်'],
            'dao-kitchen' => ['DAO Kitchen', 'ครัวดาว', 'DAO မီးဖိုချောင်'],
        ];
        $i = 0;
        foreach ($categories as $slug => [$en, $th, $my]) {
            $category = Category::query()->firstOrCreate(['slug' => $slug], ['sort_order' => $i++, 'is_active' => true]);
            if ($category->wasRecentlyCreated) {
                $category->syncTranslations(['en' => ['name' => $en], 'th' => ['name' => $th], 'my' => ['name' => $my]]);
            }
        }
    }
}
