import db from '../database/dbConnection.js';

// Lấy tất cả sản phẩm
export const getAllProducts = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*,
                   pi.imageurl as firstimg,
                   (SELECT pi2.imageurl
                    FROM product_images pi2
                    WHERE pi2.productid = p.productid
                    AND pi2.imageid > pi.imageid
                    LIMIT 1) as secondimg
            FROM products p
            LEFT JOIN product_images pi ON p.productid = pi.productid
            WHERE pi.isthumbnail = true
        `);

        // Transform data để phù hợp với frontend
        const transformedProducts = result.rows.map(product => ({
            id: product.productid,
            productid: product.productid, // Để backward compatibility
            firstImg: product.firstimg,
            secondImg: product.secondimg || product.firstimg,
            title: product.productname,
            price: parseFloat(product.price),
            discount: Math.floor(Math.random() * 30) + 5,
            stars: Math.floor(Math.random() * 2) + 4,
            description: product.productdescription || product.productname,
            count: 1,
            wishlist: false,
            compare: false,
            name: "all"
        }));

        res.status(200).json(transformedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lọc sản phẩm theo giá
export const filterProductsByPrice = async (req, res) => {
    try {
        const { minPrice = 0, maxPrice = 5000 } = req.query;

        const result = await db.query(`
            SELECT p.*,
                   pi.imageurl as firstimg,
                   (SELECT pi2.imageurl
                    FROM product_images pi2
                    WHERE pi2.productid = p.productid
                    AND pi2.imageid > pi.imageid
                    LIMIT 1) as secondimg
            FROM products p
            LEFT JOIN product_images pi ON p.productid = pi.productid
            WHERE pi.isthumbnail = true
            AND p.price >= $1 AND p.price <= $2
        `, [minPrice, maxPrice]);

        // Transform data để phù hợp với frontend
        const transformedProducts = result.rows.map(product => ({
            id: product.productid,
            productid: product.productid, // Để backward compatibility
            firstImg: product.firstimg,
            secondImg: product.secondimg || product.firstimg,
            title: product.productname,
            price: parseFloat(product.price),
            discount: Math.floor(Math.random() * 30) + 5,
            stars: Math.floor(Math.random() * 2) + 4,
            description: product.productdescription || product.productname,
            count: 1,
            wishlist: false,
            compare: false,
            name: "filtered"
        }));

        res.status(200).json(transformedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lọc sản phẩm nhiều tiêu chí
export const advancedFilterProducts = async (req, res) => {
    try {
        const {
            minPrice = 0,
            maxPrice = 5000,
            categoryId,
            minRating = 0,
            sortBy = 'popular',
            userNeeds = []
        } = req.query;

        // Xây dựng câu query cơ bản
        let query = `
            SELECT p.*,
                   c.categoryname,
                   pi.imageurl as firstimg,
                   (SELECT pi2.imageurl
                    FROM product_images pi2
                    WHERE pi2.productid = p.productid
                    AND pi2.imageid > pi.imageid
                    LIMIT 1) as secondimg
            FROM products p
            LEFT JOIN product_category pc ON p.productid = pc.productid
            LEFT JOIN categories c ON pc.categoryid = c.categoryid
            LEFT JOIN product_images pi ON p.productid = pi.productid
            WHERE pi.isthumbnail = true
            AND p.price >= $1 AND p.price <= $2
        `;

        const params = [minPrice, maxPrice];
        let paramCount = 2;

        // Thêm điều kiện category nếu có
        if (categoryId) {
            query += ` AND pc.categoryid = $${++paramCount}`;
            params.push(categoryId);
        }

        // Thêm điều kiện rating nếu có
        if (minRating > 0) {
            query += ` AND p.rating >= $${++paramCount}`;
            params.push(minRating);
        }

        // Thêm điều kiện user needs nếu có
        if (userNeeds.length > 0) {
            const needsArray = Array.isArray(userNeeds) ? userNeeds : userNeeds.split(',');
            query += ` AND c.categoryname = ANY($${++paramCount})`;
            params.push(needsArray);
        }

        // Thêm ORDER BY tùy theo sortBy
        switch (sortBy) {
            case 'priceAsc':
                query += ' ORDER BY p.price ASC';
                break;
            case 'priceDesc':
                query += ' ORDER BY p.price DESC';
                break;
            case 'new':
                // Sắp xếp theo productID giảm dần (ID cao = sản phẩm mới hơn)
                query += ' ORDER BY p.productid DESC';
                break;
            case 'popular':
            default: 
                // Sắp xếp theo độ phổ biến: dựa trên số lượng bán
                query = query.replace(
                    'SELECT p.*,',
                    `SELECT p.*,
                     COALESCE(sales.total_sold, 0) as total_sold,`
                );
                
                query = query.replace(
                    'FROM products p',
                    `FROM products p
                     LEFT JOIN (
                         SELECT productid, SUM(quantityordered) as total_sold
                         FROM order_items
                         GROUP BY productid
                     ) sales ON p.productid = sales.productid`
                );
                
                query += ' ORDER BY total_sold DESC, p.productid DESC';
                break;
        }

        const result = await db.query(query, params);

        // Transform data để phù hợp với frontend
        const transformedProducts = result.rows.map(product => ({
            id: product.productid,
            productid: product.productid, // Để backward compatibility
            firstImg: product.firstimg,
            secondImg: product.secondimg || product.firstimg,
            title: product.productname,
            price: parseFloat(product.price),
            discount: Math.floor(Math.random() * 30) + 5,
            stars: Math.floor(Math.random() * 2) + 4,
            description: product.productdescription || product.productname,
            count: 1,
            wishlist: false,
            compare: false,
            name: "filtered",
            categoryName: product.categoryname
        }));

        res.status(200).json(transformedProducts);
    } catch (error) {
        console.error('Error in advancedFilterProducts:', error);
        res.status(500).json({ message: error.message });
    }
};

// Lấy sản phẩm phổ biến (dựa trên số lượng bán)
export const getPopularProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        
        const result = await db.query(`
            SELECT p.*, 
                   pi.imageurl as firstimg,
                   (SELECT pi2.imageurl 
                    FROM product_images pi2 
                    WHERE pi2.productid = p.productid 
                    AND pi2.imageid > pi.imageid 
                    LIMIT 1) as secondimg,
                   COALESCE(sales.total_sold, 0) as total_sold
            FROM products p
            LEFT JOIN product_images pi ON p.productid = pi.productid
            LEFT JOIN (
                SELECT productid, SUM(quantityordered) as total_sold
                FROM order_items
                GROUP BY productid
            ) sales ON p.productid = sales.productid
            WHERE pi.isthumbnail = true
            ORDER BY total_sold DESC, p.productid DESC
            LIMIT $1
        `, [limit]);

        // Transform data để phù hợp với frontend
        const transformedProducts = result.rows.map(product => ({
            id: product.productid,
            productid: product.productid, // Để backward compatibility
            firstImg: product.firstimg,
            secondImg: product.secondimg || product.firstimg,
            title: product.productname,
            price: parseFloat(product.price),
            discount: Math.floor(Math.random() * 30) + 5, // Random discount 5-35%
            stars: Math.floor(Math.random() * 2) + 4, // Random stars 4-5
            description: product.productdescription || product.productname,
            count: 1,
            wishlist: false,
            compare: false,
            name: "popular"
        }));

        res.status(200).json(transformedProducts);
    } catch (error) {
        console.error('Error in getPopularProducts:', error);
        res.status(500).json({ message: error.message });
    }
};

// Lấy sản phẩm mới nhất (dựa trên productID - ID cao = mới hơn)
export const getLatestProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        
        const result = await db.query(`
            SELECT p.*, 
                   pi.imageurl as firstimg,
                   (SELECT pi2.imageurl 
                    FROM product_images pi2 
                    WHERE pi2.productid = p.productid 
                    AND pi2.imageid > pi.imageid 
                    LIMIT 1) as secondimg
            FROM products p
            LEFT JOIN product_images pi ON p.productid = pi.productid
            WHERE pi.isthumbnail = true
            ORDER BY p.productid DESC
            LIMIT $1
        `, [limit]);

        // Transform data để phù hợp với frontend
        const transformedProducts = result.rows.map(product => ({
            id: product.productid,
            productid: product.productid, // Để backward compatibility
            firstImg: product.firstimg,
            secondImg: product.secondimg || product.firstimg,
            title: product.productname,
            price: parseFloat(product.price),
            discount: Math.floor(Math.random() * 25) + 10, // Random discount 10-35%
            stars: Math.floor(Math.random() * 2) + 4, // Random stars 4-5
            description: product.productdescription || product.productname,
            count: 1,
            wishlist: false,
            compare: false,
            name: "latest"
        }));

        res.status(200).json(transformedProducts);
    } catch (error) {
        console.error('Error in getLatestProducts:', error);
        res.status(500).json({ message: error.message });
    }
};

// Lấy sản phẩm nổi bật (kết hợp popularity và latest)
export const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        
        const result = await db.query(`
            SELECT p.*, 
                   pi.imageurl as firstimg,
                   (SELECT pi2.imageurl 
                    FROM product_images pi2 
                    WHERE pi2.productid = p.productid 
                    AND pi2.imageid > pi.imageid 
                    LIMIT 1) as secondimg,
                   COALESCE(sales.total_sold, 0) as total_sold,
                   (COALESCE(sales.total_sold, 0) * 0.7 + (p.productid / 1000.0) * 0.3) as featured_score
            FROM products p
            LEFT JOIN product_images pi ON p.productid = pi.productid
            LEFT JOIN (
                SELECT productid, SUM(quantityordered) as total_sold
                FROM order_items
                GROUP BY productid
            ) sales ON p.productid = sales.productid
            WHERE pi.isthumbnail = true
            ORDER BY featured_score DESC, p.productid DESC
            LIMIT $1
        `, [limit]);

        // Transform data để phù hợp với frontend
        const transformedProducts = result.rows.map(product => ({
            id: product.productid,
            productid: product.productid, // Để backward compatibility
            firstImg: product.firstimg,
            secondImg: product.secondimg || product.firstimg,
            title: product.productname,
            price: parseFloat(product.price),
            discount: Math.floor(Math.random() * 35) + 15, // Random discount 15-50%
            stars: Math.floor(Math.random() * 2) + 4, // Random stars 4-5
            description: product.productdescription || product.productname,
            count: 1,
            wishlist: false,
            compare: false,
            name: "featured"
        }));

        res.status(200).json(transformedProducts);
    } catch (error) {
        console.error('Error in getFeaturedProducts:', error);
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết sản phẩm theo ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT p.*, 
                   pi.imageurl as firstimg,
                   (SELECT pi2.imageurl 
                    FROM product_images pi2 
                    WHERE pi2.productid = p.productid 
                    AND pi2.imageid > pi.imageid 
                    LIMIT 1) as secondimg,
                   COALESCE(sales.total_sold, 0) as total_sold,
                   c.categoryname
            FROM products p
            LEFT JOIN product_images pi ON p.productid = pi.productid
            LEFT JOIN (
                SELECT productid, SUM(quantityordered) as total_sold
                FROM order_items
                GROUP BY productid
            ) sales ON p.productid = sales.productid
            LEFT JOIN product_category pc ON p.productid = pc.productid
            LEFT JOIN categories c ON pc.categoryid = c.categoryid
            WHERE pi.isthumbnail = true
            AND p.productid = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Transform data để phù hợp với frontend
        const product = result.rows[0];
        const transformedProduct = {
            id: product.productid,
            productid: product.productid,
            firstImg: product.firstimg,
            secondImg: product.secondimg || product.firstimg,
            title: product.productname,
            price: parseFloat(product.price),
            discount: Math.floor(Math.random() * 30) + 5, // Có thể thay bằng discount thực từ DB
            stars: 4, // Default rating since no reviews table link
            description: product.productdescription || product.productname,
            count: 1,
            wishlist: false,
            compare: false,
            name: "product-detail",
            categoryName: product.categoryname,
            totalSold: product.total_sold,
            avgRating: 0, // No reviews data available
            reviewCount: 0,
            quantityInStock: product.quantityinstock,
            productSku: product.productsku,
            productVendor: product.productvendor
        };

        res.status(200).json(transformedProduct);
    } catch (error) {
        console.error('Error in getProductById:', error);
        res.status(500).json({ message: error.message });
    }
};
