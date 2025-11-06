# AI Setup Assistant - Configuration Guide

## ✨ Features

The AI Setup Assistant automatically installs and configures Minecraft plugins/mods using natural language requests.

## 🔧 Requirements

### Required Environment Variables

Add these to your `.env` file:

```env
# Required: Pterodactyl Client API Key (with full permissions)
PTERODACTYL_CLIENT_KEY=your_pterodactyl_client_api_key_here

# Optional: Google Gemini API Key (for AI understanding)
# Works without this, but uses direct search instead of AI parsing
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting Your Pterodactyl API Key

1. Log into your Pterodactyl Panel as admin
2. Go to **Account Settings** → **API Credentials**
3. Click **Create New**
4. Give it a description (e.g., "AI Setup Assistant")
5. Copy the generated key
6. Add it to your `.env` as `PTERODACTYL_CLIENT_KEY`

**Important:** This must be a **Client API Key**, not an Application API Key.

### Getting Your Google Gemini API Key (Optional)

1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"** or **"Get API key"**
3. Select or create a Google Cloud project
4. Copy the generated API key
5. Add it to your `.env` as `GEMINI_API_KEY`

**Note:** Without Gemini, the system will use direct search which still works but is less intelligent.

**Why Gemini 2.0 Flash?**
- ✅ **Completely FREE** with generous limits
- ✅ **BLAZING FAST** response times (~0.3-0.8s)
- ✅ Excellent understanding of technical requests
- ✅ Latest Gemini 2.0 model
- ✅ 10 requests per minute on free tier!

## 🚀 Usage

1. Navigate to any server's **Files** tab
2. Click the purple **"AI Setup"** button
3. Type what you want, for example:
   - "Install EssentialsX plugin"
   - "I want WorldEdit"
   - "Add a shop plugin for 1.20.1"
   - "Install JEI mod"
4. Click **"Search & Analyze"**
5. Review the results and click **"Install"** on your preferred option
6. Wait for automatic installation and server restart (if needed)

## 🎯 How It Works

1. **Detects** your server type (Paper, Spigot, Bukkit, Forge, Fabric)
2. **Extracts** Minecraft version from your server files
3. **Understands** your request using AI
4. **Searches** Modrinth for compatible plugins/mods
5. **Installs** directly to `/plugins` or `/mods` folder
6. **Restarts** server automatically if needed

## ⚠️ Troubleshooting

### "Authentication failed" Error

**Cause:** Invalid or missing `PTERODACTYL_CLIENT_KEY`

**Fix:**
- Check your `.env` file has `PTERODACTYL_CLIENT_KEY` set
- Verify the API key is valid (test it in Pterodactyl panel)
- Ensure it's a **Client API Key**, not Application API Key
- Restart your Next.js development server after adding the key

### "Gemini API error: Invalid JSON payload" or 400 Error

**Cause:** API key issue or model availability

**Fix:**
- Verify your `GEMINI_API_KEY` is valid
- Get a new key from https://aistudio.google.com/app/apikey
- Make sure you're not hitting rate limits
- Restart your development server
- The system will automatically fall back to direct search if Gemini fails

### "Failed to fetch" Console Errors

**Cause:** Browser extension interference (common with ad blockers)

**Fix:**
- These errors are harmless - the system retries automatically
- If bothering you, disable browser extensions temporarily
- Add exception for localhost in your ad blocker
- The resources API works fine despite these errors

### "Could not detect server type" Error

**Cause:** Server files not recognized

**Fix:**
- Ensure your server has a recognized jar file (paper.jar, spigot.jar, etc.)
- Or has a `/mods` or `/plugins` folder

### "No matching plugins/mods found" Error

**Cause:** Search term not found on Modrinth

**Fix:**
- Try different keywords
- Check spelling
- Some plugins may not be on Modrinth (check SpigotMC, CurseForge)

## 🔒 Security

- All API keys are stored server-side only (never sent to client)
- File uploads go directly to your Pterodactyl server
- Only authorized users can install plugins/mods
- Downloads are verified from official Modrinth API

## 📦 Supported Sources

- **Modrinth** - Primary source for plugins and mods
- Automatically filters by:
  - Server type (Paper/Spigot/Bukkit vs Forge/Fabric)
  - Minecraft version compatibility
  - Loader type

## 🎨 UI Features

- **Server Info Display** - Shows detected type and version
- **Best Match Highlighting** - Top result highlighted
- **Download Counts** - Shows popularity
- **Categories** - Quick identification
- **Success/Error Feedback** - Clear status messages
- **Auto-close** - Dialog closes after successful installation

## 💡 Tips

- Be specific in your requests for better results
- Check the "Best Match" suggestion first
- Server will restart automatically if the plugin/mod requires it
- Installation happens in the background - you can close the dialog
- Check the File Manager after installation to verify files

## 🆘 Support

If you encounter issues:

1. Check the browser console for detailed errors
2. Verify all environment variables are set correctly
3. Ensure Pterodactyl panel is accessible
4. Check server logs for installation errors
5. Verify the plugin/mod is compatible with your server version

## 📝 Notes

- Works for both plugins (Bukkit/Spigot/Paper) and mods (Forge/Fabric)
- Automatic version detection from server files
- Intelligent search using Modrinth API
- One-click installation with auto-restart
- Compatible with all major server types
