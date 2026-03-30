# ⛽ نظام مراقبة خزانات الوقود

تطبيق ويب متكامل لمراقبة وتسجيل قراءات خزانات الوقود في المحطات الثلاث.

---

## 🏗️ هيكل المشروع

```
tank-monitor/
├── server.js          ← الخادم (Express + Supabase)
├── schema.sql         ← هيكل قاعدة البيانات
├── package.json
├── vercel.json        ← إعدادات النشر على Vercel
├── .env.example       ← نموذج متغيرات البيئة
└── public/
    └── index.html     ← واجهة المستخدم
```

---

## 🚀 خطوات الرفع أون لاين

### الخطوة 1 — إنشاء قاعدة البيانات على Supabase

1. افتح [supabase.com](https://supabase.com) وأنشئ حساباً
2. اضغط **New Project** → اختر اسم `tank-monitor` وكلمة مرور
3. انتظر حتى يتهيأ المشروع (~1 دقيقة)
4. اذهب إلى **SQL Editor** → انسخ محتوى `schema.sql` والصقه → اضغط **Run**
5. اذهب إلى **Settings → API** واحفظ:
   - `Project URL` → مثال: `https://abcdef.supabase.co`
   - `service_role` key (من قسم Project API keys)

### الخطوة 2 — رفع الكود على GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tank-monitor.git
git push -u origin main
```

### الخطوة 3 — النشر على Vercel

1. افتح [vercel.com](https://vercel.com) وسجّل دخول بحساب GitHub
2. اضغط **New Project** → اختر مستودع `tank-monitor`
3. في قسم **Environment Variables** أضف:
   ```
   SUPABASE_URL        = https://YOUR_ID.supabase.co
   SUPABASE_SERVICE_KEY = your_service_role_key
   ```
4. اضغط **Deploy** ✅

بعد دقائق سيكون التطبيق على رابط مثل:
`https://tank-monitor-xxx.vercel.app`

---

## 💻 التشغيل المحلي (للتطوير)

```bash
# 1. تثبيت الحزم
npm install

# 2. إنشاء ملف .env
cp .env.example .env
# ثم عدّل القيم داخل .env

# 3. تشغيل الخادم
npm run dev
# أو
npm start
```

افتح المتصفح على: `http://localhost:3000`

---

## 📡 API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/health` | فحص حالة الخادم |
| GET | `/api/readings` | جلب كل القراءات |
| GET | `/api/readings?station_key=iwaa` | فلترة حسب المحطة |
| GET | `/api/readings?from_date=2024-01-01&to_date=2024-12-31` | فلترة حسب الفترة |
| POST | `/api/readings` | إضافة أو تحديث قراءة |
| DELETE | `/api/readings/:tank_id/:date` | حذف قراءة |
| GET | `/api/stats` | إحصائيات ملخصة |

---

## 🗄️ هيكل قاعدة البيانات

جدول `readings`:

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | uuid | المعرّف الفريد |
| tank_id | text | معرّف الخزان (مثل `iwaa_1`) |
| station_key | text | مفتاح المحطة (`iwaa` / `kilani` / `jabha`) |
| reading_date | date | تاريخ القراءة |
| manual_val | numeric | الذرعة اليدوية |
| elec_val | numeric | الذرعة الإلكترونية |
| created_at | timestamptz | وقت الإنشاء |
| updated_at | timestamptz | وقت آخر تعديل |

---

## 🏭 المحطات والخزانات

| المحطة | مفتاح | الخزانات |
|--------|-------|----------|
| محطة الإيواء | `iwaa` | `iwaa_1`, `iwaa_2`, `iwaa_3` |
| محطة الكيلاني | `kilani` | `kilani_1`, `kilani_2`, `kilani_5`, `kilani_p` |
| محطة الجبهة | `jabha` | `jabha_1`, `jabha_2` |

---

## 🔧 التقنيات المستخدمة

- **Frontend:** HTML5 / CSS3 / JavaScript (Vanilla) + Chart.js
- **Backend:** Node.js + Express.js
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
