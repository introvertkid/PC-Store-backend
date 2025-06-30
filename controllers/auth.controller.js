import bcrypt from "bcrypt";
import db from "../database/dbConnection.js";
import nodemailer from "nodemailer";

const generateCustomerId = async () => {
  const result = await db.query("SELECT MAX(customerID) FROM customers");
  const maxId = result.rows[0].max || 0;
  return maxId + 1;
};

const storeVerificationCode = async (email, code, expiresIn = 10) => {
  try {
    await db.query("DELETE FROM verification_codes WHERE email = $1", [email]);

    const expires = new Date(Date.now() + expiresIn * 60 * 1000);
    await db.query(
      "INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)",
      [email, code, expires]
    );

    console.log(`Verification code stored in database for ${email}`);
  } catch (error) {
    console.error("Error storing verification code:", error);
    throw error;
  }
};

const getVerificationCode = async (email) => {
  try {
    const result = await db.query(
      "SELECT code, expires_at FROM verification_codes WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      console.log(`No verification code found for ${email}`);
      return null;
    }

    const { code, expires_at } = result.rows[0];

    if (new Date(expires_at) < new Date()) {
      console.log(`Verification code expired for ${email}`);
      await db.query("DELETE FROM verification_codes WHERE email = $1", [
        email,
      ]);
      return null;
    }

    return { code, expires: new Date(expires_at).getTime() };
  } catch (error) {
    console.error("Error retrieving verification code:", error);
    return null;
  }
};

const deleteVerificationCode = async (email) => {
  try {
    await db.query("DELETE FROM verification_codes WHERE email = $1", [email]);
    console.log(`Verification code deleted for ${email}`);
  } catch (error) {
    console.error("Error deleting verification code:", error);
  }
};

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    const checkEmail = await db.query(
      "SELECT email FROM customers WHERE email = $1",
      [email]
    );
    if (checkEmail.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: "This email is already in use.",
      });
    }

    const customerId = await generateCustomerId();

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const customerName = `${firstName} ${lastName}`;

    const insertQuery = `
      INSERT INTO customers (
        customerID, 
        customerName, 
        customerLastName, 
        customerFirstName, 
        userPassword, 
        email, 
        phoneNumber
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING customerID, email, customerName
    `;

    const values = [
      customerId,
      customerName,
      lastName,
      firstName,
      hashedPassword,
      email,
      phoneNumber,
    ];

    const result = await db.query(insertQuery, values);

    console.log(
      `SIGNUP SUCCESSFUL: ${result.rows[0].customername} (${result.rows[0].email}) has registered successfully!`
    );

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      customer: {
        id: result.rows[0].customerid,
        name: result.rows[0].customername,
        email: result.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Error during'inscription:", error);
    res.status(500).json({
      success: false,
      message: "Error during'inscription. Please try again.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userQuery = `
      SELECT 
        customerID, 
        customerName, 
        customerFirstName, 
        customerLastName, 
        email, 
        userPassword, 
        phoneNumber 
      FROM customers 
      WHERE email = $1
    `;

    const result = await db.query(userQuery, [email]);

    if (result.rowCount === 0) {
      console.log(
        `LOGIN FAILURE: Login attempt with non-existent email: ${email}`
      );
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.userpassword);

    if (!isPasswordValid) {
      console.log(
        `LOGIN FAILURE: Incorrect password for: ${user.customername} (${email})`
      );
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }

    delete user.userpassword;

    console.log(
      `LOGIN SUCCESSFUL: ${user.customername} (${email}) logged in successfully!`
    );

    res.status(200).json({
      success: true,
      message: "Connection successful!",
      customer: {
        id: user.customerid,
        name: user.customername,
        firstName: user.customerfirstname,
        lastName: user.customerlastname,
        email: user.email,
        phoneNumber: user.phonenumber,
      },
    });
  } catch (error) {
    console.error("Error while connecting:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in. Please try again.",
    });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
});

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`Password reset request received for email: ${email}`);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailCheckQuery =
      "SELECT customerID, email FROM customers WHERE LOWER(email) = LOWER($1)";
    console.log(
      `Executing query: ${emailCheckQuery} with params: [${email.trim()}]`
    );

    const emailCheck = await db.query(emailCheckQuery, [email.trim()]);
    console.log(`Query result rowCount: ${emailCheck.rowCount}`);

    if (emailCheck.rowCount === 0) {
      console.log(`No account found for email: ${email}`);
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    const userEmail = emailCheck.rows[0].email;
    console.log(`Found user with email: ${userEmail}`);

    const verificationCode = generateVerificationCode();
    console.log(
      `Generated verification code for ${userEmail}: ${verificationCode}`
    );

    await storeVerificationCode(userEmail, verificationCode, 10);

    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: userEmail,
      subject: "Password Reset Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>We received a request to reset your password. Please use the verification code below to complete the process:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="letter-spacing: 8px; font-size: 32px; margin: 0;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`PASSWORD RESET CODE SENT: Code sent to ${userEmail}`);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("Error during password reset request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request. Please try again.",
    });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log(`Verification attempt for email: ${email}, code: ${code}`);

    const verification = await getVerificationCode(email);
    console.log(`Verification data for ${email}:`, verification);

    if (!verification) {
      console.log(`No verification code found for email: ${email}`);
      return res.status(400).json({
        success: false,
        message:
          "Verification code expired or not found. Please request a new code.",
      });
    }

    if (verification.code !== code) {
      console.log(
        `Invalid code provided. Expected: ${verification.code}, Got: ${code}`
      );
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please try again.",
      });
    }

    console.log(`Verification successful for email: ${email}`);

    res.status(200).json({
      success: true,
      message: "Verification successful.",
    });
  } catch (error) {
    console.error("Error during code verification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify code. Please try again.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const verification = await getVerificationCode(email);

    if (!verification) {
      return res.status(400).json({
        success: false,
        message:
          "Verification expired. Please restart the password reset process.",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const updateResult = await db.query(
      "UPDATE customers SET userPassword = $1 WHERE email = $2 RETURNING customerID, email, customerName",
      [hashedPassword, email]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    await deleteVerificationCode(email);

    console.log(
      `PASSWORD RESET SUCCESSFUL: Password reset for ${updateResult.rows[0].customername} (${email})`
    );

    res.status(200).json({
      success: true,
      message: "Password reset successful.",
      customer: {
        id: updateResult.rows[0].customerid,
        name: updateResult.rows[0].customername,
        email: updateResult.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
    });
  }
};
