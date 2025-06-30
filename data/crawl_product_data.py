import pandas as pd
import requests
import time
import random
from tqdm import tqdm

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

def parser_product(json):
    d = dict()
    d['id'] = json.get('id')
    d['sku'] = json.get('sku')
    d['short_description'] = json.get('short_description')
    d['price'] = json.get('price')
    d['list_price'] = json.get('list_price')
    d['avg_rating'] = json.get('rating_average')
    d['price'] = json.get('price')
    d['discount'] = json.get('discount')
    d['discount_rate'] = json.get('discount_rate')
    d['order_count'] = json.get('order_count')
    d['is_visible'] = json.get('is_visible')
    d['brand'] = json.get('brand_name')
    d['name'] = json.get('name')
    d['image'] = json.get('thumbnail_url')
    # d['impression_info'] = json.get('impression_info').get('metadata').get('delivery_info_badge_text')
    return d



df_id = pd.read_csv('product_id.csv')
p_ids = df_id.id.to_list()
print(p_ids)
result = []
for pid in tqdm(p_ids, total=len(p_ids)):
    response = requests.get('https://tiki.vn/api/v2/products/{}'.format(pid), headers=headers, params=params, cookies=cookies)
    if response.status_code == 200:
        print('Crawl data {} success !!!'.format(pid))
        result.append(parser_product(response.json()))
    # time.sleep(random.randrange(3, 5))
df_product = pd.DataFrame(result)
df_product.to_csv('crawled_data.csv', index=False)