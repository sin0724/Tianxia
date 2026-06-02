-- Force PostgREST to reload its schema cache after column rename in migration 030
NOTIFY pgrst, 'reload schema';
