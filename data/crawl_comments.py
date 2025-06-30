import requests
import time
import random
import pandas as pd
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
    'product_id': '58259141',
    'sort': 'score|desc,id|desc,stars|all',
    'page': '1',
    'limit': '10',
    'include': 'comments'
}

def comment_parser(json):
    d = dict()
    d['id'] = json.get(id)
    d['title'] = json.get('title')
    d['content'] = json.get('content')
    d['thank_count'] = json.get('thank_count')
    d['customer_id']  = json.get('customer_id')
    d['rating'] = json.get('rating')
    d['created_at'] = json.get('created_at')
    d['customer_name'] = json.get('created_by').get('name')
    d['purchased_at'] = json.get('created_by').get('purchased_at')
    return d


df_id = pd.read_csv('product_id.csv')
p_ids = df_id.id.to_list()
result = []
for pid in tqdm(p_ids, total=len(p_ids)):
    params['product_id'] = pid
    print('Crawl comment for product {}'.format(pid))
    for i in range(2):
        params['page'] = i
        response = requests.get('https://tiki.vn/api/v2/reviews', headers=headers, params=params, cookies=cookies)
        if response.status_code == 200:
            print('Crawl comment page {} success!!!'.format(i))
            for comment in response.json().get('data'):
                result.append(comment_parser(comment))
df_comment = pd.DataFrame(result)
df_comment.to_csv('comments_data.csv', index=False)