import pool from "./dbConnection.js";

async function checkProducts() {
  try {
    const result = await pool.query("SELECT * FROM products");
    console.log("data products:");
    console.table(result.rows);
  } catch (err) {
    console.error("error query:", err.message);
  }
}

checkProducts();
