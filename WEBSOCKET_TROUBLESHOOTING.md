# WebSocket Connection Troubleshooting

## Current Issue

Your application is successfully retrieving WebSocket credentials from Pterodactyl, but the WebSocket connection to the Pterodactyl Wings service is failing.

## Diagnosis

### ✅ What's Working
- API route `/api/servers/[id]/websocket` returns 200 status
- WebSocket credentials are successfully retrieved from Pterodactyl
- Valid JWT tokens are being generated
- Server lookup and authentication is working

### ❌ What's Failing
- WebSocket connection to `wss://play1.darkbyte.in:8080/api/servers/292393b0-4d10-40f6-82c6-142a73479634/ws`
- This is **NOT a code issue** - it's an infrastructure issue with your Pterodactyl panel

## Root Cause

The WebSocket connection failure indicates one of these issues:

1. **Pterodactyl Wings Service Not Running**
   - The Wings daemon may not be running on your game server node
   - Check Wings status: `systemctl status wings`

2. **Network/Firewall Issue**
   - Port 8080 may be blocked
   - SSL/TLS certificate issues
   - Network routing problems

3. **Pterodactyl Configuration**
   - Wings might not be properly configured to accept WebSocket connections
   - SSL certificates may be invalid or expired

## How to Fix

### 1. Check Wings Service
```bash
# SSH into your Pterodactyl Wings server (play1.darkbyte.in)
systemctl status wings

# If not running, start it
systemctl start wings

# Check logs
journalctl -u wings -n 50
```

### 2. Verify Port Access
```bash
# Test WebSocket connectivity
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://play1.darkbyte.in:8080/api/servers/292393b0-4d10-40f6-82c6-142a73479634/ws
```

### 3. Check Pterodactyl Panel Configuration
- Go to your Pterodactyl admin panel at `https://pro.darkbyte.in`
- Navigate to **Nodes** → Select your node
- Verify the FQDN is set to `play1.darkbyte.in`
- Check that SSL is properly configured

### 4. Check Firewall Rules
```bash
# On your Wings server
ufw status
# Ensure port 8080 is open for HTTPS/WSS
ufw allow 8080/tcp
```

### 5. Verify SSL Certificate
```bash
# Check SSL certificate
openssl s_client -connect play1.darkbyte.in:8080 -servername play1.darkbyte.in
```

## Alternative: Use Pterodactyl's Built-in Console

If the WebSocket issue persists, users can:
1. Click a link to open the server console directly in Pterodactyl panel
2. Access the console at: `https://pro.darkbyte.in/server/292393b0-4d10-40f6-82c6-142a73479634`

## Adding Fallback UI

You can add a fallback message in your console tab:

```tsx
{!isConnected && (
  <div className="text-yellow-500 text-sm">
    Console connection unavailable. 
    <a 
      href={`https://pro.darkbyte.in/server/${serverIdentifier}`}
      target="_blank"
      className="underline ml-2"
    >
      Open in Pterodactyl Panel
    </a>
  </div>
)}
```

## Next Steps

1. Verify Wings is running on `play1.darkbyte.in`
2. Check Wings logs for any errors
3. Test WebSocket connectivity manually
4. Consider adding a fallback link to Pterodactyl's console
