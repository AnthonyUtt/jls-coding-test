"""JLS Coding Test API
Back-End Flask API for connecting to database. Supports CRUD
functionality for all products, and creating of "transactions."
"""

from flask import Flask, jsonify, request, abort
from flask_mysqldb import MySQL
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

app.config['MYSQL_HOST'] = 'anthonyutt.mysql.pythonanywhere-services.com'
app.config['MYSQL_USER'] = 'anthonyutt'
app.config['MYSQL_PASSWORD'] = 'VNh@4uEZECXv3KL'
app.config['MYSQL_DB'] = 'anthonyutt$default'

mysql = MySQL(app)

@app.route('/')
def hello_world():
    return "Back-End API for JLS Coding Test"

@app.route('/products', methods=['GET', 'POST'])
def get_many_products():
    cur = mysql.connection.cursor()
    if request.method == 'GET':
        search_term = request.args.get('search')
        if search_term:
            sql = 'SELECT CoreNumber, InternalTitle, Vendor, SUM(IFNULL(Quantity, 0)) AS \'Quantity\' ' \
                + 'FROM products p ' \
                + 'LEFT OUTER JOIN locations l ON p.CoreNumber = l.ProductCode ' \
                + 'WHERE CoreNumber = %s ' \
                + 'OR InternalTitle LIKE %s ' \
                + 'OR VendorTitle LIKE %s ' \
                + 'GROUP BY CoreNumber, InternalTitle, Vendor; '
            cur.execute(sql, (search_term, '%' + search_term + '%', \
                '%' + search_term + '%', ))
        else:
            sql = 'SELECT CoreNumber, InternalTitle, Vendor, SUM(IFNULL(Quantity, 0)) AS \'Quantity\' ' \
                + 'FROM products p ' \
                + 'LEFT OUTER JOIN locations l ON p.CoreNumber = l.ProductCode ' \
                + 'GROUP BY CoreNumber, InternalTitle, Vendor; '
            cur.execute(sql)
        row_headers = [x[0] for x in cur.description]
        rs = cur.fetchall()
        json_data = []
        for r in rs:
            json_data.append(dict(zip(row_headers, r)))
    elif request.method == 'POST':
        data = request.form
        if data.get('CoreNumber') and data.get('InternalTitle') \
                and data.get('Vendor') and data.get('VendorSKU') \
                and data.get('BackupVendor') and data.get('BackupVendorSKU') \
                and data.get('BufferDays') and data.get('MinimumLevel'):
            keys = ', '.join(data.keys())
            values = ', '.join(['%s'] * len(data))
            sql = 'INSERT INTO products (%s) VALUES (%s);' % (keys, values)
            cur.execute(sql, tuple([data.get(x) for x in data.keys()]))
            mysql.connection.commit()
            json_data = 'Created new product'
        else:
            abort(400)
    return jsonify(json_data)

@app.route('/products/<string:core_number>', methods=['GET', 'POST', 'DELETE'])
def show_product_data(core_number):
    cur = mysql.connection.cursor()
    if request.method == 'GET':
        cur.execute('SELECT * FROM products WHERE CoreNumber = %s;', (core_number, ))
        row_headers=[x[0] for x in cur.description]
        rv = cur.fetchone()
        json_data = dict(zip(row_headers, rv))
    elif request.method == 'POST':
        data = request.form
        if data:
            setter = ', '.join([x + ' = %s' for x in data.keys()])
            sql = 'UPDATE products SET %s WHERE CoreNumber = %s;' % \
                (setter, '%s', )
            cur.execute(sql, tuple([data.get(x) for x in data.keys()] + [core_number]))
            mysql.connection.commit()
        else:
            abort(400)
        json_data = 'Updated product %s' % core_number
    elif request.method == 'DELETE':
        cur.execute('DELETE FROM products WHERE CoreNumber = %s;', (core_number, ))
        mysql.connection.commit()
        json_data = 'Deleted product %s' % core_number
    return jsonify(json_data)

@app.route('/locations/<string:core_number>', methods=['GET', 'POST'])
def show_product_locations(core_number):
    cur = mysql.connection.cursor()
    if request.method == 'GET':
        cur.execute('SELECT * FROM locations WHERE ProductCode = %s;', (core_number, ))
        row_headers = [x[0] for x in cur.description]
        rs = cur.fetchall()
        json_data = []
        for r in rs:
            json_data.append(dict(zip(row_headers, r)))
    elif request.method == 'POST':
        data = request.form
        if data:
            n = data.get('quantity')
            s = json.loads(data.get('source'))

            if n and s:
                sql = 'INSERT INTO locations (Warehouse, ProductCode, Location, Quantity) ' \
                    + 'VALUES (%s, %s, %s, %s); '
                cur.execute(sql, (s['warehouse'], core_number, s['location'], n))
                mysql.connection.commit()
                json_data = 'Added location for product %s' % core_number
            else:
                abort(400)
        else:
            abort(400)
    return jsonify(json_data)

@app.route('/warehouses', methods=['GET'])
def get_warehouses():
    cur = mysql.connection.cursor()
    cur.execute('SELECT DISTINCT Location FROM locations;')
    rs = cur.fetchall()
    json_data = [x[0] for x in rs]
    return jsonify(json_data)

@app.route('/transaction', methods=['POST'])
def create_transaction():
    cur = mysql.connection.cursor()
    data = request.form
    if data:
        f = data.get('function')
        n = data.get('quantity')
        src = data.get('source')
        dest = data.get('dest')

        if f == 'increment':
            if dest is None:
                abort(400)
        elif f == 'decrement':
            if src is None:
                abort(400)
        elif f == 'transfer':
            if src is None or dest is None:
                abort(400)
        else:
            abort(400)  # invalid function
        
        if f and n:
            if f == 'increment':
                d = json.loads(dest)
                check = 'SELECT COUNT(*) FROM locations ' \
                    + 'WHERE ProductCode = %s AND Warehouse = %s ' \
                    + ' AND Location = %s; '
                cur.execute(check, (d['code'], d['warehouse'], d['location'], ))
                count = cur.fetchone()
                if count > 0:
                    sql = 'UPDATE locations ' \
                        + 'SET Quantity = Quantity + %s ' \
                        + 'WHERE ProductCode = %s ' \
                        + 'AND Warehouse = %s ' \
                        + 'AND Location = %s; '
                else:
                    sql = 'INSERT INTO locations (Quantity, ProductCode, Warehouse, Location) ' \
                        + 'VALUES (%s, %s, %s, %s); '
                cur.execute(sql, (n, d['code'], d['warehouse'], d['location'], ))
                mysql.connection.commit()
            elif f == 'decrement':
                s = json.loads(src)
                sql = 'UPDATE locations ' \
                    + 'SET Quantity = Quantity - %s ' \
                    + 'WHERE ProductCode = %s ' \
                    + 'AND Warehouse = %s ' \
                    + 'AND Location = %s; '
                cur.execute(sql, (n, s['code'], s['warehouse'], s['location'], ))
                mysql.connection.commit()
            elif f == 'transfer':
                s = json.loads(src)
                d = json.loads(dest)
                # Decrement qty from source
                sql = 'UPDATE locations ' \
                    + 'SET Quantity = Quantity - %s ' \
                    + 'WHERE ProductCode = %s ' \
                    + 'AND Warehouse = %s ' \
                    + 'AND Location = %s; '
                cur.execute(sql, (n, s['code'], s['warehouse'], s['location'], ))
                
                # Increment qty in dest
                sql = 'UPDATE locations ' \
                    + 'SET Quantity = Quantity + %s' \
                    + 'WHERE ProductCode = %s ' \
                    + 'AND Warehouse = %s ' \
                    + 'AND Location = %s; '
                cur.execute(sql, (n, d['code'], d['warehouse'], d['location'], ))

                mysql.connection.commit()
        else:
            abort(400)
        json_data = 'Transaction complete'
    else:
        abort(400)
    return jsonify(json_data)
