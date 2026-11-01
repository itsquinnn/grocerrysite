
create table public.settings (key text primary key, value text not null);
grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "public read" on public.settings for select using (true);
create policy "admin write" on public.settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create or replace function public.set_setting(_key text, _value text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _key='vat_rate' and not (_value ~ '^\d+(\.\d+)?$' and _value::numeric between 0 and 40) then raise exception 'VAT rate must be a number between 0 and 40'; end if;
  insert into public.settings(key,value) values (_key,_value) on conflict (key) do update set value=excluded.value;
end $$;
grant execute on function public.set_setting(text,text) to authenticated;
create or replace function public.vat_rate() returns numeric language sql stable security definer set search_path=public as $$ select coalesce((select value::numeric from public.settings where key='vat_rate'), 13) $$;

create or replace function public.quote_order(_items jsonb, _coupon text, _shipping_method text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare it jsonb; p record; sub numeric := 0; disc numeric := 0; ship numeric; tax numeric; c record; lines jsonb := '[]'; msg text := null; qty int;
begin
  if _items is null or jsonb_array_length(_items)=0 then raise exception 'Cart is empty'; end if;
  for it in select * from jsonb_array_elements(_items) loop
    qty := (it->>'quantity')::int;
    if qty is null or qty < 1 or qty > 20 then raise exception 'Invalid quantity'; end if;
    select * into p from public.products where id=(it->>'product_id')::uuid and is_active;
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    if p.stock < qty then raise exception 'Only % left of %', p.stock, p.name; end if;
    sub := sub + p.price*qty;
    lines := lines || jsonb_build_object('product_id',p.id,'name',p.name,'sku',p.sku,'image',p.images[1],'size',coalesce(it->>'size',''),'color',coalesce(it->>'color',''),'unit_price',p.price,'quantity',qty,'line_total',p.price*qty);
  end loop;
  if _coupon is not null and length(trim(_coupon))>0 then
    select * into c from public.coupons where upper(code)=upper(trim(_coupon)) and is_active;
    if not found then msg := 'Invalid coupon code';
    elsif c.expires_at is not null and c.expires_at < now() then msg := 'This coupon has expired';
    elsif c.usage_limit is not null and c.used_count >= c.usage_limit then msg := 'This coupon has reached its usage limit';
    elsif sub < c.min_order then msg := 'Minimum order of Rs. ' || c.min_order || ' required';
    else
      disc := case when c.discount_type='percent' then round(sub*c.value/100,2) else c.value end;
      if c.max_discount is not null then disc := least(disc, c.max_discount); end if;
      disc := least(disc, sub);
    end if;
  end if;
  ship := case when _shipping_method='express' then 250 when sub - disc >= 5000 then 0 else 150 end;
  tax := round((sub - disc) * public.vat_rate() / 100, 2);
  return jsonb_build_object('lines',lines,'subtotal',sub,'discount',disc,'coupon_code',case when disc>0 then upper(trim(_coupon)) else null end,'coupon_error',msg,'shipping_fee',ship,'tax',tax,'tax_rate',public.vat_rate(),'total',sub-disc+ship+tax);
end $$;
