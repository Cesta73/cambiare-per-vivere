/*
# Fix mutable search_path on update_updated_at_column

## Problem
The function `public.update_updated_at_column` was created without a fixed
search_path, leaving it vulnerable to search_path hijacking (an attacker with
CREATE SCHEMA privilege could shadow pg_catalog or public and redirect the
function to malicious code).

## Change
Recreate the function with `SET search_path = ''` and fully-qualified type
references (`pg_catalog.now()`) so it is immune to search_path manipulation.

## Security
- `SET search_path = ''` pins the search_path to empty for the duration of the
  function call, eliminating the attack surface.
- All type references are schema-qualified.
*/

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;
