import sqlite3

db_path = 'product_intelligence.db'
con = sqlite3.connect(db_path)
con.row_factory = sqlite3.Row

# Check tables
tables = con.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
print('TABLES:', [t['name'] for t in tables])

# Count rows in each key table
for tbl in ['products','product_versions','product_attributes','suppliers','supplier_products']:
    try:
        cnt = con.execute(f'SELECT COUNT(*) as c FROM {tbl}').fetchone()['c']
        print(f'  {tbl}: {cnt} rows')
    except Exception as e:
        print(f'  {tbl}: ERROR - {e}')

# Show all supplier_products
print()
print('=== SUPPLIER PRODUCTS (all) ===')
rows = con.execute('''
    SELECT sp.id, p.product_code, s.name as supplier, sp.price, sp.stock_quantity, sp.delivery_days
    FROM supplier_products sp
    JOIN products p ON p.id = sp.product_id
    JOIN suppliers s ON s.id = sp.supplier_id
    ORDER BY p.product_code, sp.price
''').fetchall()
for r in rows:
    print(f'  {r["product_code"]} | {r["supplier"]} | INR {r["price"]} | {r["stock_quantity"]} stock | {r["delivery_days"]} days')
if not rows:
    print('  (none)')

# Show GB-100 specifically
print()
print('=== GB-100 SUPPLIER OFFERS ===')
rows = con.execute('''
    SELECT p.product_code, s.name as supplier, sp.price, sp.stock_quantity, sp.delivery_days, sp.advantage_notes
    FROM supplier_products sp
    JOIN products p ON p.id = sp.product_id
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE p.product_code = 'GB-100'
''').fetchall()
for r in rows:
    print(f'  {r["product_code"]} | {r["supplier"]} | INR {r["price"]} | {r["stock_quantity"]} stock | {r["delivery_days"]} days')
if not rows:
    print('  (none - no supplier offers for GB-100)')

# Show GB-100 product versions
print()
print('=== GB-100 VERSIONS ===')
rows = con.execute('''
    SELECT pv.id, pv.version_number, pv.is_current, pv.status
    FROM product_versions pv
    JOIN products p ON p.id = pv.product_id
    WHERE p.product_code = 'GB-100'
''').fetchall()
for r in rows:
    print(f'  version_id={r["id"]} {r["version_number"]} is_current={r["is_current"]} status={r["status"]}')

# Show GB-100 attributes (current version)
print()
print('=== GB-100 CURRENT PRODUCT ATTRIBUTES ===')
rows = con.execute('''
    SELECT pa.attribute_name, pa.attribute_value, pa.normalized_value, pa.unit, pa.verification_status
    FROM product_attributes pa
    JOIN product_versions pv ON pv.id = pa.product_version_id
    JOIN products p ON p.id = pv.product_id
    WHERE p.product_code = 'GB-100' AND pv.is_current = 1
''').fetchall()
for r in rows:
    print(f'  {r["attribute_name"]}: {r["attribute_value"]} (norm={r["normalized_value"]}, unit={r["unit"]})')
if not rows:
    print('  (none - no attributes for current version)')

# Show M-101 supplier offers
print()
print('=== M-101 SUPPLIER OFFERS ===')
rows = con.execute('''
    SELECT p.product_code, s.name as supplier, sp.price, sp.stock_quantity, sp.delivery_days
    FROM supplier_products sp
    JOIN products p ON p.id = sp.product_id
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE p.product_code = 'M-101'
''').fetchall()
for r in rows:
    print(f'  {r["product_code"]} | {r["supplier"]} | INR {r["price"]} | {r["stock_quantity"]} stock | {r["delivery_days"]} days')
if not rows:
    print('  (none)')

# Show all products
print()
print('=== ALL PRODUCTS ===')
rows = con.execute('SELECT product_code, name, category, status FROM products ORDER BY category, product_code').fetchall()
for r in rows:
    print(f'  {r["product_code"]} | {r["name"]} | {r["category"]} | {r["status"]}')

con.close()
