-- Add child_age integer column to child_profiles
-- The app uses exact age, not age bands

alter table public.child_profiles
  add column if not exists child_age integer
  check (child_age between 2 and 17);

-- Backfill from age_band where possible
update public.child_profiles
set child_age = case
  when age_band = '2-4'  then 3
  when age_band = '5-7'  then 6
  when age_band = '8-12' then 10
  else null
end
where child_age is null and age_band is not null;
