# nextrj_db changelog

## 0.5.1 2023-12-19

- Use `std@0.209.0/cli/parse_args.ts>parseArgs` instead of `std@0.209.0/flags/mod.ts>parse`

## 0.5.0 2023-12-19

- Upgrade to deno/x/postgresjs@v3.4.3
- Upgrade to deno/std@0.209.0

## 0.4.0 2023-11-29

- Make ValueParser can parse undefined, null or empty value
- Improve compatibility for undefined and null value

## 0.3.0 2023-09-27

- Add convenient method for convert string-condition to partial-query

## 0.2.0 2023-09-27

- Complete reconstruction

## 0.1.0 2023-09-25

- Base query-template implementation
