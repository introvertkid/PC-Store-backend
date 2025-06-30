import requests
import time
import random
import pandas as pd

cookies = {
    '_trackity': '81b5aa2f-92d7-ccaa-36ef-9bcf80d85f5c',
    '_ga': 'GA1.1.1299629296.1745177983',
    '_gcl_au': '1.1.886918456.1745177992',
    '__iid': '749',
    '__su': '0',
    '_hjSessionUser_522327': 'eyJpZCI6ImQxZGEyNDNkLThmZWQtNWZkZC1hZjkzLTY4MWRmNjhkOGNiNyIsImNyZWF0ZWQiOjE3NDUxNzc5OTIwNTcsImV4aXN0aW5nIjp0cnVlfQ==',
    'cto_bundle': 'Aov9Cl9GWWJVN3VHYmlSQlJaV2NFSTYlMkJxc01XdEh6WG5DOUZwdTVpcGc5RFJ2clRvbG41ZnlHWGVZaUpUSGR6QUhHd2xRSVhtZHVpVHZiTll4cndlTzBsemg1Q3N2RnM1QmoxNjYwRUUzWkJnSHJwJTJGWkMyMUhHUkVPTTFCVWN1eCUyQlpIVWZmWkdENVkxTzYlMkZHbElwYWphOFQlMkJWd2cxSzAxaFk0ZnBkcUg0b0dWd2doMjNRalZmVkMlMkJ6blFVT0pJMmNTTkRudTdjZDluN0tUYm4lMkZ1ZWQ1VFdPaVFXbkUxNXNPdlBlMDRyZFBCbnYlMkI1b0U5JTJGTkFYN2M4OHVTdVolMkZ2T1dubkg',
    '_gcl_aw': 'GCL.1745180149.Cj0KCQjwtpLABhC7ARIsALBOCVrVVdiS3puMuuPs2g9oWobLpFZFWG2IC2BAz8Wv6mMxJBmoX3PViQkaAlGpEALw_wcB',
    '_gcl_gs': '2.1.k1$i1745180146$u165506106',
    'TOKENS': '{"access_token":"yureOIQTsMh2PfF1pgv76E85WVRUYcCm"}',
    '_ga_S9GLR1RQFJ': 'GS1.1.1745522790.4.0.1745522790.60.0.0',
    'delivery_zone': 'Vk4wMzQwMjQwMTM=',
    'amp_99d374': 'BK1NRn_aPCXlvVUsPaMZ5a...1ipm09jhl.1ipm0a1cf.72.8b.fd'
}


headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'X-Guest-Token': 'yureOIQTsMh2PfF1pgv76E85WVRUYcCm',
    'Referer': 'https://tiki.vn/laptop-may-vi-tinh-linh-kien/c1846',
    'Connection': 'keep-alive',
    'TE': 'Trailers'
}

params = {
    'limit': 40,
    'include': 'advertisement',
    'aggregations': 2,
    'version': 'home-persionalized',
    'trackity_id': '81b5aa2f-92d7-ccaa-36ef-9bcf80d85f5c',
    'category': 1846,
    'page': 1,
    'urlKey': 'laptop-may-vi-tinh-linh-kien'
}

product_id = []
for i in range(1, 3):
    params['page'] = i
    response = requests.get('https://tiki.vn/api/v2/products', headers=headers, params=params)#, cookies=cookies)
    if response.status_code == 200:
        print('request success!!!')
        for record in response.json().get('data'):
            product_id.append({'id': record.get('id')})
    time.sleep(random.randrange(3, 10))

df = pd.DataFrame(product_id)
df.to_csv('product_id.csv', index=False)