SELECT current_database() AS database_name,
       current_user AS connected_as,
       current_setting('server_version') AS postgres_version,
       now() AS checked_at;
SELECT version, checksum, applied_at
FROM public.schema_migrations
ORDER BY version;
SELECT count(*) AS public_table_count
FROM pg_tables
WHERE schemaname = 'public';
