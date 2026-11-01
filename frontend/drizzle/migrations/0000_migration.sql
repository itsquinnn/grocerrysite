
create type public.app_role as enum ('admin','customer');
create type public.order_status as enum ('pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','returned','refunded');
create type public.payment_status as enum ('unpaid','pending','paid','failed','refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, avatar_url text,
  notify_email boolean not null default true, notify_offers boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null, unique(user_id, role)
);
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile write" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles(user_id, role) values (new.id, 'customer');
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- catalog
create table public.categories (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text, image_url text, sort int not null default 0);
create table public.brands (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null, sku text unique not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  subcategory text,
  brand_id uuid references public.brands(id) on delete set null,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock int not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  sizes text[] not null default '{}', colors text[] not null default '{}',
  specs jsonb not null default '{}',
  is_featured boolean not null default false, is_active boolean not null default true,
  sold_count int not null default 0,
  rating_avg numeric(3,2) not null default 0, rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.products(category_id); create index on public.products(brand_id); create index on public.products(created_at desc);
grant select on public.categories, public.brands, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.brands, public.products to authenticated;
grant all on public.categories, public.brands, public.products to service_role;
alter table public.categories enable row level security; alter table public.brands enable row level security; alter table public.products enable row level security;
create policy "public read" on public.categories for select using (true);
create policy "public read" on public.brands for select using (true);
create policy "public read" on public.products for select using (is_active or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.brands for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- user data
create table public.addresses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  full_name text not null, phone text not null, province text not null, district text not null,
  city text not null, street text not null, landmark text, is_default boolean not null default false,
  created_at timestamptz not null default now());
create table public.cart_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null default '', color text not null default '', quantity int not null check (quantity > 0),
  unique(user_id, product_id, size, color));
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(), unique(user_id, product_id));
grant select, insert, update, delete on public.addresses, public.cart_items, public.wishlist_items to authenticated;
grant all on public.addresses, public.cart_items, public.wishlist_items to service_role;
alter table public.addresses enable row level security; alter table public.cart_items enable row level security; alter table public.wishlist_items enable row level security;
create policy "own" on public.addresses for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own" on public.cart_items for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own" on public.wishlist_items for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- coupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(), code text unique not null,
  description text, discount_type text not null check (discount_type in ('percent','fixed')),
  value numeric(12,2) not null check (value > 0), min_order numeric(12,2) not null default 0,
  max_discount numeric(12,2), expires_at timestamptz, usage_limit int, used_count int not null default 0,
  is_active boolean not null default true, created_at timestamptz not null default now());
grant select, insert, update, delete on public.coupons to authenticated; grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "admin" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- orders
create sequence public.order_seq start 10001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('DV' || nextval('public.order_seq')),
  invoice_number text unique,
  user_id uuid not null, idempotency_key text unique,
  customer_name text not null, customer_email text not null, customer_phone text not null,
  shipping_address jsonb not null, billing_address jsonb not null,
  subtotal numeric(12,2) not null, discount numeric(12,2) not null default 0, coupon_code text,
  shipping_fee numeric(12,2) not null, tax numeric(12,2) not null, total numeric(12,2) not null,
  shipping_method text not null, payment_method text not null,
  payment_status payment_status not null default 'unpaid', transaction_ref text,
  status order_status not null default 'pending', tracking_number text,
  estimated_delivery date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null, sku text not null, image text, size text, color text,
  unit_price numeric(12,2) not null, quantity int not null, line_total numeric(12,2) not null);
create table public.order_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  status order_status not null, note text, created_at timestamptz not null default now());
create table public.return_requests (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null, reason text not null, status text not null default 'requested', created_at timestamptz not null default now());
create index on public.orders(user_id); create index on public.order_items(order_id);
grant select on public.orders, public.order_items, public.order_events to authenticated;
grant update on public.orders to authenticated; grant insert on public.order_events to authenticated;
grant select, insert, update on public.return_requests to authenticated;
grant all on public.orders, public.order_items, public.order_events, public.return_requests to service_role;
alter table public.orders enable row level security; alter table public.order_items enable row level security;
alter table public.order_events enable row level security; alter table public.return_requests enable row level security;
create policy "own or admin" on public.orders for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own or admin" on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "own or admin" on public.order_events for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "admin insert" on public.order_events for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "own read" on public.return_requests for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own create" on public.return_requests for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid() and o.status='delivered'));
create policy "admin update" on public.return_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid, author_name text not null, rating int not null check (rating between 1 and 5),
  title text, body text not null, is_approved boolean not null default true, created_at timestamptz not null default now());
create index on public.reviews(product_id);
grant select on public.reviews to anon, authenticated; grant insert, update, delete on public.reviews to authenticated; grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "read approved" on public.reviews for select using (is_approved or user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "write own" on public.reviews for insert to authenticated with check (user_id=auth.uid());
create policy "admin moderate" on public.reviews for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin or own delete" on public.reviews for delete to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.refresh_product_rating() returns trigger language plpgsql security definer set search_path=public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products set rating_avg = coalesce((select round(avg(rating)::numeric,2) from public.reviews where product_id=pid and is_approved),0),
    rating_count = (select count(*) from public.reviews where product_id=pid and is_approved) where id=pid;
  return null;
end $$;
create trigger reviews_rating after insert or update or delete on public.reviews for each row execute function public.refresh_product_rating();

-- support
create sequence public.ticket_seq start 5001;
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(), ticket_number text unique not null default ('TK' || nextval('public.ticket_seq')),
  user_id uuid, name text not null, email text not null, category text not null, order_number text,
  subject text not null, message text not null, status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid, is_staff boolean not null default false, body text not null, created_at timestamptz not null default now());
grant select, insert, update on public.support_tickets, public.ticket_messages to authenticated;
grant insert on public.support_tickets to anon;
grant all on public.support_tickets, public.ticket_messages to service_role;
alter table public.support_tickets enable row level security; alter table public.ticket_messages enable row level security;
create policy "create" on public.support_tickets for insert to anon, authenticated with check (user_id is null or user_id=auth.uid());
create policy "own read" on public.support_tickets for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.support_tickets for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "read" on public.ticket_messages for select to authenticated using (exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "write" on public.ticket_messages for insert to authenticated with check (author_id=auth.uid() and exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=auth.uid() or public.has_role(auth.uid(),'admin'))) and (is_staff=false or public.has_role(auth.uid(),'admin')));

-- notifications, newsletter, stock alerts
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null, title text not null, body text, link text, is_read boolean not null default false, created_at timestamptz not null default now());
grant select, update, delete on public.notifications to authenticated; grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own" on public.notifications for all to authenticated using (user_id=auth.uid());
create table public.newsletter_subscribers (id uuid primary key default gen_random_uuid(), email text unique not null, created_at timestamptz not null default now());
grant insert on public.newsletter_subscribers to anon, authenticated; grant select on public.newsletter_subscribers to authenticated; grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "subscribe" on public.newsletter_subscribers for insert to anon, authenticated with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
create policy "admin read" on public.newsletter_subscribers for select to authenticated using (public.has_role(auth.uid(),'admin'));
create table public.stock_alerts (id uuid primary key default gen_random_uuid(), user_id uuid not null, product_id uuid not null references public.products(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id, product_id));
grant select, insert, delete on public.stock_alerts to authenticated; grant all on public.stock_alerts to service_role;
alter table public.stock_alerts enable row level security;
create policy "own" on public.stock_alerts for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- pricing logic (single source of truth)
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
  tax := round((sub - disc) * 0.13, 2);
  return jsonb_build_object('lines',lines,'subtotal',sub,'discount',disc,'coupon_code',case when disc>0 then upper(trim(_coupon)) else null end,'coupon_error',msg,'shipping_fee',ship,'tax',tax,'total',sub-disc+ship+tax);
end $$;
grant execute on function public.quote_order(jsonb,text,text) to anon, authenticated;

create or replace function public.place_order(_items jsonb, _coupon text, _shipping_method text, _payment_method text, _shipping jsonb, _billing jsonb, _email text, _idem text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare q jsonb; oid uuid; onum text; l jsonb; existing record; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in to place an order'; end if;
  if _shipping_method not in ('standard','express') then raise exception 'Invalid shipping method'; end if;
  if _payment_method not in ('cod') then raise exception 'This payment method is not available yet'; end if;
  if coalesce(_shipping->>'full_name','')='' or coalesce(_shipping->>'phone','')='' or coalesce(_shipping->>'street','')='' or coalesce(_shipping->>'district','')='' then raise exception 'Shipping address is incomplete'; end if;
  select id, order_number into existing from public.orders where idempotency_key=_idem and user_id=uid;
  if found then return jsonb_build_object('order_id',existing.id,'order_number',existing.order_number); end if;
  q := public.quote_order(_items, _coupon, _shipping_method);
  -- lock & decrement stock
  for l in select * from jsonb_array_elements(q->'lines') loop
    update public.products set stock = stock - (l->>'quantity')::int, sold_count = sold_count + (l->>'quantity')::int
      where id=(l->>'product_id')::uuid and stock >= (l->>'quantity')::int;
    if not found then raise exception 'Not enough stock for %', l->>'name'; end if;
  end loop;
  insert into public.orders(user_id, idempotency_key, customer_name, customer_email, customer_phone, shipping_address, billing_address,
    subtotal, discount, coupon_code, shipping_fee, tax, total, shipping_method, payment_method, payment_status, status, estimated_delivery)
  values (uid, _idem, _shipping->>'full_name', _email, _shipping->>'phone', _shipping, coalesce(_billing,_shipping),
    (q->>'subtotal')::numeric, (q->>'discount')::numeric, q->>'coupon_code', (q->>'shipping_fee')::numeric, (q->>'tax')::numeric, (q->>'total')::numeric,
    _shipping_method, _payment_method, 'unpaid', 'confirmed', current_date + case when _shipping_method='express' then 2 else 5 end)
  returning id, order_number into oid, onum;
  update public.orders set invoice_number = 'INV-' || substr(onum,3) where id=oid;
  insert into public.order_items(order_id, product_id, name, sku, image, size, color, unit_price, quantity, line_total)
    select oid, (x->>'product_id')::uuid, x->>'name', x->>'sku', x->>'image', x->>'size', x->>'color', (x->>'unit_price')::numeric, (x->>'quantity')::int, (x->>'line_total')::numeric
    from jsonb_array_elements(q->'lines') x;
  insert into public.order_events(order_id, status, note) values (oid,'pending','Order placed'), (oid,'confirmed','Cash on delivery order confirmed');
  if q->>'coupon_code' is not null then update public.coupons set used_count=used_count+1 where upper(code)=q->>'coupon_code'; end if;
  delete from public.cart_items where user_id=uid;
  insert into public.notifications(user_id,title,body,link) values (uid,'Order '||onum||' confirmed','We will notify you when it ships.','/account/orders/'||oid);
  return jsonb_build_object('order_id',oid,'order_number',onum);
end $$;
grant execute on function public.place_order(jsonb,text,text,text,jsonb,jsonb,text,text) to authenticated;

create or replace function public.cancel_order(_order_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare o record;
begin
  select * into o from public.orders where id=_order_id and user_id=auth.uid() for update;
  if not found then raise exception 'Order not found'; end if;
  if o.status not in ('pending','confirmed','processing') then raise exception 'This order can no longer be cancelled'; end if;
  update public.products p set stock = p.stock + i.quantity, sold_count = greatest(p.sold_count - i.quantity,0) from public.order_items i where i.order_id=o.id and i.product_id=p.id;
  update public.orders set status='cancelled', updated_at=now() where id=o.id;
  insert into public.order_events(order_id,status,note) values (o.id,'cancelled','Cancelled by customer');
end $$;
grant execute on function public.cancel_order(uuid) to authenticated;

create or replace function public.admin_set_order_status(_order_id uuid, _status order_status, _tracking text, _note text) returns void
language plpgsql security definer set search_path=public as $$
declare o record;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into o from public.orders where id=_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if _status='cancelled' and o.status <> 'cancelled' then
    update public.products p set stock = p.stock + i.quantity from public.order_items i where i.order_id=o.id and i.product_id=p.id;
  end if;
  update public.orders set status=_status, tracking_number=coalesce(nullif(_tracking,''),tracking_number), updated_at=now(),
    payment_status = case when _status='delivered' and payment_method='cod' then 'paid'::payment_status when _status='refunded' then 'refunded'::payment_status else payment_status end
  where id=o.id;
  insert into public.order_events(order_id,status,note) values (o.id,_status,_note);
  insert into public.notifications(user_id,title,body,link) values (o.user_id,'Order '||o.order_number||' update','Status: '||replace(_status::text,'_',' '),'/account/orders/'||o.id);
end $$;
grant execute on function public.admin_set_order_status(uuid,order_status,text,text) to authenticated;

create or replace function public.track_order(_order_number text, _phone text) returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('order_number',o.order_number,'status',o.status,'created_at',o.created_at,'estimated_delivery',o.estimated_delivery,'tracking_number',o.tracking_number,
    'city',o.shipping_address->>'city','district',o.shipping_address->>'district',
    'items',(select jsonb_agg(jsonb_build_object('name',name,'quantity',quantity,'image',image)) from public.order_items where order_id=o.id),
    'events',(select jsonb_agg(jsonb_build_object('status',status,'created_at',created_at) order by created_at) from public.order_events where order_id=o.id))
  from public.orders o where upper(o.order_number)=upper(trim(_order_number)) and right(regexp_replace(o.customer_phone,'\D','','g'),6)=right(regexp_replace(_phone,'\D','','g'),6) limit 1 $$;
grant execute on function public.track_order(text,text) to anon, authenticated;
