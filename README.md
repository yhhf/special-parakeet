<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
   `npm run dev`

## Windows Executable

1. Build for Windows:
   `npm run electron:build`
2. The executable will be in `dist_electron/` directory.

## Database (SQLite)
The Windows app uses a local `database.sqlite` file in your User Data directory.
- Development: `npm run electron` to run with database.
- Web: Database features are disabled.
