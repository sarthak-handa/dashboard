const fs = require('fs');
let d = fs.readFileSync('dev-server.js', 'utf8');

const badBlock = `        } catch (err) {
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            });
            res.end(JSON.stringify(localDevApiCache[proxyPath].data));
            return;
        }`;

const goodBlock = `        } catch (err) {
            console.error("Error reading Book1.xlsx:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to read local Book1.xlsx mock data" }));
        }
        return;
    }

    // 0a-2. Local Forecast Mock using temp_forecast.json
    if (req.url.includes("/excel/forecast/dashboard")) {
        console.log(\`[DEV SERVER] Intercepting Forecast request -> serving temp_forecast.json\`);
        try {
            const forecastData = fs.readFileSync(require('path').join(__dirname, 'temp_forecast.json'), 'utf8');
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            });
            res.end(forecastData);
        } catch (err) {
            console.error("Error reading temp_forecast.json:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Failed to read local temp_forecast.json mock data" }));
        }
        return;
    }

    // 0b. Transparent API Proxy for Localhost -> Vercel (with local dev caching)
    if (req.url.startsWith("/excel") || req.url.startsWith("/api")) {
        const proxyPath = req.url.startsWith("/api") ? req.url : "/api" + req.url;

        // Serve from local dev cache if available (0 calls to Vercel / SAP)
        if (localDevApiCache[proxyPath] && localDevApiCache[proxyPath].data) {
            console.log(\`[DEV SERVER] Serving \${proxyPath} from local memory cache (0 SAP hits)\`);
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            });
            res.end(JSON.stringify(localDevApiCache[proxyPath].data));
            return;
        }`;

d = d.replace(badBlock, goodBlock);
fs.writeFileSync('dev-server.js', d);
console.log('Fixed dev-server.js successfully!');
