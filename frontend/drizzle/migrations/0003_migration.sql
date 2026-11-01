
create or replace function public.submit_ticket(_name text, _email text, _category text, _order_number text, _subject text, _message text)
returns text language plpgsql security definer set search_path=public as $$
declare t text;
begin
  if length(trim(coalesce(_name,''))) < 2 or _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(trim(coalesce(_subject,''))) < 3 or length(trim(coalesce(_message,''))) < 10 then
    raise exception 'Please complete all required fields';
  end if;
  if _category not in ('order','return','payment','product','complaint','other') then raise exception 'Invalid category'; end if;
  if (select count(*) from public.support_tickets where email=lower(_email) and created_at > now()-interval '1 hour') >= 5 then
    raise exception 'Too many requests, please try again later';
  end if;
  insert into public.support_tickets(user_id,name,email,category,order_number,subject,message)
  values (auth.uid(), left(trim(_name),100), lower(trim(_email)), _category, nullif(left(trim(coalesce(_order_number,'')),20),''), left(trim(_subject),150), left(trim(_message),4000))
  returning ticket_number into t;
  return t;
end $$;
grant execute on function public.submit_ticket(text,text,text,text,text,text) to anon, authenticated;
