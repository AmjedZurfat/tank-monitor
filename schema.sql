-- ===================================================
-- schema.sql — نظام مراقبة خزانات الوقود
-- نفّذ هذا في Supabase → SQL Editor
-- ===================================================

-- جدول القراءات الرئيسي
create table if not exists readings (
  id            uuid        default gen_random_uuid() primary key,
  tank_id       text        not null,
  station_key   text        not null,
  reading_date  date        not null,
  manual_val    numeric(10,2) not null,
  elec_val      numeric(10,2) not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  -- لا يمكن تكرار نفس الخزان في نفس التاريخ
  unique(tank_id, reading_date)
);

-- فهرس للبحث السريع
create index if not exists idx_readings_station  on readings(station_key);
create index if not exists idx_readings_tank     on readings(tank_id);
create index if not exists idx_readings_date     on readings(reading_date);

-- تحديث updated_at تلقائياً
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_readings_updated_at
  before update on readings
  for each row execute function update_updated_at();

-- Row Level Security
alter table readings enable row level security;

-- سياسة: السماح بكل العمليات (يمكن تقييدها لاحقاً)
create policy "allow_all" on readings
  for all
  using (true)
  with check (true);

-- ===================================================
-- بيانات تجريبية (اختياري — احذفها قبل الإنتاج)
-- ===================================================
-- insert into readings (tank_id, station_key, reading_date, manual_val, elec_val) values
--   ('iwaa_1', 'iwaa', '2024-01-01', 120.5, 121.0),
--   ('iwaa_1', 'iwaa', '2024-01-02', 115.0, 115.8),
--   ('kilani_1', 'kilani', '2024-01-01', 200.0, 199.5);
