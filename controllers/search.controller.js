import { Client } from "@elastic/elasticsearch";
import db from "../database/dbConnection.js";

const esClient = new Client({ node: 'http://localhost:9200' });

export const elasticSearch = async (req, res) => {
    const { query } = req.query;

    try {
        const result = await esClient.search({
            index: "products",
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ["productname^2", "productdescription"],
                        fuzziness: "AUTO" // Thêm fuzziness để tìm kiếm gần đúng
                    }
                }
            }
        });

        console.log(`Search query: ${query}, Results: ${result.hits.hits.length}`);
        res.status(200).json(result.hits.hits.map(hit => hit._source));
    } catch (err) {
        console.error("Search error:", err.message);
        res.status(500).send(err.message);
    }
};

(async () => {
    try {
        await esClient.indices.delete({ index: "products", ignore_unavailable: true });

        await esClient.indices.create({
            index: "products",
            body: {
                mappings: {
                    properties: {
                        productid: { type: "keyword" },
                        productname: { type: "text" },
                        productdescription: { type: "text" },
                        price: { type: "float" },
                        firstimg: { type: "text" },
                    }
                }
            }
        });

        const query = `
            WITH ProductImages AS (
                SELECT
                    productID,
                    ROW_NUMBER() OVER (PARTITION BY productID ORDER BY imageID) as rn,
                    imageURL
                FROM product_images
            )
            SELECT 
                p.productID as id,
                p.productName as name,
                p.productDescription as description,
                p.price,
                pi1.imageURL as firstimg
            FROM products p
            LEFT JOIN ProductImages pi1 ON p.productID = pi1.productID AND pi1.rn = 1
        `;
        const result = await db.query(query);

        console.log(`There are ${result.rowCount} products in result`);
        console.log("Raw query results: ", result.rows);

        if (result.rowCount === 0) {
            console.log("No products found.");
            return;
        }

        const bulkOps = result.rows.flatMap((doc) => [
            { index: { _index: "products", _id: String(doc.id) } },
            {
                productid: doc.id,
                productname: doc.name,
                productdescription: doc.description,
                price: doc.price,
                firstimg: doc.firstimg,
            }
        ]);

        console.log("Bulk operations:", bulkOps);
        await esClient.bulk({ refresh: true, body: bulkOps });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Đợi 1 giây
        console.log("Data synced to Elasticsearch successfully.");
    } catch (err) {
        console.error("Sync failed:", err);
    }
})();