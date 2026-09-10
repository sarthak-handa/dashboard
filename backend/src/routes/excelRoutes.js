const express = require("express");
const router = express.Router();
const Excel = require("../models/ExcelModel");
const User = require("../models/User");
const { readProjectsSheet } = require("../../utils/graph.js");
const { readActualSheet } = require("../../utils/graph.js");
const { verifyToken } = require("../middleware/auth");
const axios = require("axios"); // Import Axios for Graph API calls

// --- CONFIGURATION: GRAPH API CREDENTIALS ---
// Ideally, put these in your .env file
const TENANT_ID =
  process.env.TENANT_ID || "a0e08c58-7003-49f2-a898-bfb4a1b05815";
const CLIENT_ID =
  process.env.CLIENT_ID || "674b7459-54de-4d1d-b13a-0070c7b57d58";
const CLIENT_SECRET =
  process.env.CLIENT_SECRET || "";

// process.env.CLIENT_SECRET || "";

const DRIVE_ID =
  "b!-1MZkE8WdUCwHHHaP1rzH_PqGBIe57tJvXHEOqKXXGHlO_rJZfmnQLPiI9rdBJ_7";
const FORECAST_FILE_ID = "01YUMYDKJKYCODJHCFLVEJRHTMXUVRRHRO";
const ACTUALS_FILE_ID = "01YUMYDKJ4P2DAPAXKUNCJH5CCCZ3RZ35F";

// --- HELPER: GET ACCESS TOKEN ---
async function getGraphAccessToken() {
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      params,
    );
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error fetching Graph Token:",
      error.response?.data || error.message,
    );
    return null;
  }
}

// --- HELPER: GET FILE METADATA (TIMESTAMP) ---
async function getFileMetadata(fileId) {
  try {
    const token = await getGraphAccessToken();
    if (!token) return null;

    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data.lastModifiedDateTime;
  } catch (error) {
    console.error(
      `Error fetching metadata for file ${fileId}:`,
      error.response?.data || error.message,
    );
    return null;
  }
}

// --- EXISTING HELPER FUNCTIONS ---

function mapProjectsSheet(rows) {
  // rows[0] is header
  return rows
    .slice(1)
    .filter((r) => r[0]) // PROJECT not empty
    .map((r) => {
      return {
        project: String(r[0]).trim(), // Column1
        pm: String(r[2] || "").trim(), // Column3
        assembly: String(r[3] || "").trim(), // Column4
        billing: Number(String(r[7] || 0).replace(/[^0-9.-]/g, "")) || 0, // Column7
        status: String(r[7] || "")
          .toLowerCase()
          .includes("disp")
          ? "Dispatched"
          : "Not Dispatched",
        month: String(r[8] || "").trim(), // Column8 / Dispatch Month
      };
    });
}

function normalizeStatus(val) {
  if (!val) return "Not Dispatched";
  const v = String(val).trim().toLowerCase();
  if (v === "disp." || v === "disp" || v === "dispatched") return "Dispatched";
  if (v.includes("hold")) return "Hold";
  return "Not Dispatched";
}

function extractLine(project) {
  if (!project) return "";
  const parts = String(project).split("-");
  return parts[parts.length - 1].trim();
}

function mapCategory(line) {
  const l = line.toUpperCase();
  if (
    [
      "6HI CRM",
      "4HI CRM",
      "CRM",
      "6HI",
      "6 STAND TANDEM MILL",
      "5 STAND TANDEM MILL",
    ].includes(l)
  )
    return "CRM";

  if (["CGL", "GI/GL LINE"].includes(l)) return "CGL";
  if (["SPARE", "SPARES", "POR SPARE", "JSW BAWAL"].includes(l)) return "SPARE";
  if (l === "ARP") return "ARP";
  if (l === "CCL") return "CCL";
  if (["REVAMP", "TPI REVAMP"].includes(l)) return "REVAMP";
  if (["TRIMMING", "TRIMMER"].includes(l)) return "TRIMMING";
  if (["PICKLING", "5 TANK PICKLING"].includes(l)) return "PICKLING";
  if (["4HI SPM", "SPM"].includes(l)) return "SPM";
  if (l === "APL") return "APL";

  return "OTHER";
}

let fiscalYearStart;
let fiscalYearEnd;

function isInCurrentFiscalWindow(dispatchDate) {
  if (!(dispatchDate instanceof Date) || isNaN(dispatchDate)) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);

  if (dispatchDate < startOfCurrentMonth) return false;

  if (currentMonth <= 2) {
    fiscalYearStart = currentYear - 1;
    fiscalYearEnd = currentYear;
  } else {
    fiscalYearStart = currentYear;
    fiscalYearEnd = currentYear + 1;
  }
  const fiscalEndDate = new Date(fiscalYearStart + 1, 2, 31, 23, 59, 59);
  return dispatchDate >= startOfCurrentMonth && dispatchDate <= fiscalEndDate;
}

/* ------------------------------------
   SAVE EXCEL (FIRST TIME)
------------------------------------ */
router.post("/save", verifyToken, async (req, res) => {
  try {
    const { sheetName, data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid excel data" });
    }
    const excel = await Excel.create({
      sheetName,
      data,
      createdBy: req.user?._id,
    });
    res.json({
      success: true,
      message: "Excel saved successfully",
      excelId: excel._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   UPDATE EXCEL
------------------------------------ */
router.put("/update/:id", verifyToken, async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid excel data" });
    }
    const updated = await Excel.findByIdAndUpdate(
      req.params.id,
      {
        data,
        updatedAt: new Date(),
      },
      { new: true },
    );
    if (!updated) {
      return res.status(404).json({ message: "Excel record not found" });
    }
    res.json({
      success: true,
      message: "Excel updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   GET LATEST EXCEL (DB-FIRST LOGIC)
------------------------------------ */
router.get("/latestExcel", verifyToken, async (req, res) => {
  try {
    const excel = await Excel.findOne().sort({ updatedAt: -1 });
    req.user = await User.findById(req.user._id)
      .select("-password")
      .populate("branches");

    const EXCEL_BRANCH = "excel";
    const hasExcelBranch = req.user.branches?.some(
      (b) => b.name?.toLowerCase() === EXCEL_BRANCH,
    );

    if (!hasExcelBranch) {
      return res.status(403).json({
        message: "Access denied: You don't have access to view the excel",
      });
    }
    res.json(excel || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/latest", verifyToken, async (req, res) => {
  try {
    const excel = await Excel.findOne().sort({ updatedAt: -1 });
    res.json(excel || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   OPTIONAL: DELETE
------------------------------------ */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Excel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------
   READ PROJECTS SHEET DIRECTLY FROM SHAREPOINT
------------------------------------ */
router.get("/sharepoint/projects", async (req, res) => {
  try {
    console.log("here");
    const rows = await readProjectsSheet();
    res.json({
      source: "SharePoint Excel",
      sheet: "PROJECTS",
      rowCount: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("SharePoint Excel error:", err.message);
    res.status(500).json({
      message: "Failed to read SharePoint Excel",
      error: err.message,
    });
  }
});

/* ------------------------------------
   CLEAN PROJECTS DATA FOR DASHBOARD
------------------------------------ */
router.get("/forecast/projects", async (req, res) => {
  try {
    const rows = await readProjectsSheet();
    const data = mapProjectsSheet(rows);
    res.json({
      source: "SharePoint Excel",
      sheet: "PROJECTS",
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Forecast projects error:", err.message);
    res.status(500).json({
      message: "Failed to prepare forecast data",
      error: err.message,
    });
  }
});

/* ------------------------------------
   FINAL DASHBOARD DATA (POWER BI EQUIVALENT)
------------------------------------ */
router.get("/forecast/dashboard", async (req, res) => {
  try {
    // 1. Fetch Data and Metadata in Parallel for speed
    const [rows, lastUpdated] = await Promise.all([
      readProjectsSheet(),
      getFileMetadata(FORECAST_FILE_ID),
    ]);

    const headerSkipped = rows.slice(1);
    const data = headerSkipped
      .filter((r) => r[0] && r[0] !== "PROJECT")
      .map((r) => {
        const dispatchDate = r[26] ? new Date(r[26]) : null;
        // const dispatchDate = r[18] ? new Date(r[18]) : null;
        const line = extractLine(r[0]);
        return {
          project: String(r[0]).trim(),
          pm: String(r[2] || "").trim(),
          assembly: String(r[3] || "").trim(),
          billing: Number(String(r[6] || 0).replace(/[^0-9.-]/g, "")) || 0,
          status: normalizeStatus(r[7]),
          dispatchMonth: dispatchDate,
          month: dispatchDate
            ? dispatchDate.toLocaleString("en-US", { month: "short" })
            : "",
          line,
          category: mapCategory(line),
        };
      })
      .filter((d) => isInCurrentFiscalWindow(d.dispatchMonth));

    res.json({
      source: "SharePoint Excel",
      fiscalLogic: "Current month → March",
      fiscalYear: (fiscalYearStart || "2026") + "-" + (fiscalYearEnd || "2027"),
      lastUpdated: lastUpdated, // <--- New Field
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Forecast dashboard error:", err.message);
    res.status(500).json({
      message: "Failed to build dashboard data",
      error: err.message,
    });
  }
});

router.get("/actuals/dashboard", async (req, res) => {
  try {
    // 1. Fetch Data and Metadata in Parallel
    const [rows, lastUpdated] = await Promise.all([
      readActualSheet(),
      getFileMetadata(ACTUALS_FILE_ID),
    ]);

    const headerSkipped = rows.slice(1);
    const data = headerSkipped
      .filter((r) => r[0] && r[0] !== "PROJECT")
      .map((r) => {
        const dispatchDate = r[18] ? new Date(r[18]) : null;
        const line = r[17];
        return {
          project: String(r[0]).trim(),
          pm: String(r[2] || "").trim(),
          assembly: String(r[3] || "").trim(),
          billing: Number(String(r[6] || 0).replace(/[^0-9.-]/g, "")) || 0,
          status: normalizeStatus(r[7]),
          dispatchMonth: dispatchDate,
          month: dispatchDate
            ? dispatchDate.toLocaleString("en-US", { month: "short" })
            : "",
          line,
          category: line,
        };
      });

    // Note: The original filter for fiscal window was commented out in your code.
    // .filter((d) => isInCurrentFiscalWindow(d.dispatchMonth));

    res.json({
      source: "SharePoint Excel",
      fiscalLogic: "April → Previous month",
      fiscalYear: (fiscalYearStart || "2025") + "-" + (fiscalYearEnd || "2026"),
      lastUpdated: lastUpdated, // <--- New Field
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Actuals dashboard error:", err.message);
    res.status(500).json({
      message: "Failed to build dashboard data",
      error: err.message,
    });
  }
});

/* ------------------------------------
   SAP S/4HANA OData PROXY
   Browser cannot call SAP directly (CORS + exposed creds).
   This server-side proxy adds Basic auth from env and returns the JSON.
------------------------------------ */
router.get("/actuals/sap", async (req, res) => {
  try {
    const baseUrl = process.env.SAP_BASE_URL;
    const sapUser = process.env.SAP_USER;
    const sapPass = process.env.SAP_PASS;

    if (!baseUrl || !sapUser || !sapPass) {
      return res
        .status(500)
        .json({ message: "SAP credentials are not configured on the server" });
    }

    // TEMP DIAGNOSTIC: should print 13 and 40. Remove once auth works.
    console.log(
      "SAP creds loaded -> user len:",
      sapUser.length,
      "pass len:",
      sapPass.length,
    );

    const entity =
      "/sap/opu/odata/sap/YY1_GSTR1_SUMMARY_API_CDS/YY1_GSTR1_SUMMARY_API" +
      "(p_from_dt=datetime'2026-04-01T00:00:00',p_to_dt=datetime'2027-03-31T00:00:00')/Set";

    const sapResponse = await axios.get(`${baseUrl}${entity}`, {
      params: {
        $filter:
          "doc_type eq 'F2' or doc_type eq 'G2' or doc_type eq 'S1' or doc_type eq 'S2'",
        $select:
          "doc_type,Project,ProductName,TOTAL_SALE_WITHOUT_TAX,monthno,Billing_date",
        $format: "json",
      },
      auth: { username: sapUser, password: sapPass },
      headers: { Accept: "application/json" },
    });

    res.json(sapResponse.data);
  } catch (err) {
    console.error(
      "SAP proxy error:",
      err.response?.status,
      err.response?.data || err.message,
    );
    res.status(err.response?.status || 500).json({
      message: "Failed to fetch SAP data",
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;
