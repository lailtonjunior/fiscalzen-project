export PGPASSWORD='fiscalzen_dev'
psql -U fiscalzen -d fiscalzen -c "CREATE USER test_runner WITH PASSWORD 'test_pass'; ALTER USER test_runner WITH SUPERUSER;"
psql -U fiscalzen -d fiscalzen -c "GRANT ALL PRIVILEGES ON DATABASE fiscalzen_test TO test_runner;"
