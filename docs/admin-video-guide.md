# Admin Video Manager Guide

This guide is for first-time admins who want to manage workout videos on the treadmill. No technical knowledge is required.

---

## Before You Start

**You need an admin account.** A regular user account cannot access the admin area. If you do not have one, ask whoever manages the server to assign your account the admin role.

**Use a modern browser.** Chrome, Firefox, Edge, or Safari (recent versions) all work. Avoid very old browsers.

**Keep the browser tab open during uploads.** Large video files can take several minutes to upload. Do not close the tab, refresh, or navigate away until you see the success message.

---

## Where to Go

1. Open the app in a browser and go to **`/login`** to sign in with your admin account.
2. After signing in, go to the **Admin Dashboard** at **`/admin`**.
3. On the dashboard you will see a **Videos** card — click **"Manage videos"** to open the Video Manager. You can also click **Videos** in the left-hand navigation sidebar at any time.

> If you see a **"Forbidden"** message or the admin dashboard is not visible after signing in, your account does not have the admin role yet. Contact your system administrator to have it assigned.

---

## The Two Tabs: Videos and Regions

At the top of the page you will see two tabs:

| Tab | What it does |
|---|---|
| **Regions** | Groups that videos belong to (e.g. "North America", "Africa"). Every video must belong to a region. |
| **Videos** | All individual workout videos. You can add, edit, show/hide, or delete them here. |

---

## Step 1 — Create a Region (if needed)

Every video must be assigned to a region. If the region you need does not already exist, create it first.

1. Click the **Regions** tab.
2. Click **+ Add Region**.
3. Enter a **Region Name** (e.g. `Europe`).
4. Optionally upload a **Cover Image** — this is the picture users see representing that region on the video browsing screen.
5. Click **Save**.

> If you try to delete a region that still has videos assigned to it, the deletion will be blocked. Remove or move those videos first.

---

## Step 2 — Upload a Video

1. Click the **Videos** tab.
2. Click **+ Add Video**.
3. Fill in the form:

| Field | Required? | Notes |
|---|---|---|
| **Video File** | Yes | Must be an `.mp4` file. See format details below. |
| **Title** | No | Auto-filled from the filename. You can change it. |
| **Region** | Yes | Pick from existing regions. |
| **Thumbnail Image** | No | The preview image shown before the video plays. See image details below. |
| **Visible** | No | Toggle whether users can see the video. Defaults to visible. |

4. Click **Upload**. A progress indicator will appear while the file uploads. **Do not close the tab or navigate away.** Wait until you see a green confirmation message in the top-right corner before doing anything else.

---

## Naming Convention

The system uses the video **filename** (without the `.mp4` extension) as the basis for both the title and thumbnail matching. Getting the filename right means less manual editing later.

### How filenames become titles

When you upload a video, the filename is automatically converted to a display title using these rules:

1. Every word is capitalised (Title Case).
2. ` - ` (a hyphen surrounded by spaces) is converted to ` – ` (an en-dash).

**Examples:**

| Filename | Auto-generated title |
|---|---|
| `morning run.mp4` | `Morning Run` |
| `kenya - sunrise trail.mp4` | `Kenya – Sunrise Trail` |
| `north-america-coastal.mp4` | `North-America-Coastal` |
| `nordic walk easy.mp4` | `Nordic Walk Easy` |

> **Tip:** Use spaces between words and use ` - ` (space, hyphen, space) as a section separator for the cleanest auto-titles. Avoid underscores — they will appear literally in the title.

### How thumbnails are matched to videos

The thumbnail file must have the **exact same base name** as the video file. The extension can be different and the capitalisation does not matter.

**Examples:**

| Video file | Matching thumbnail |
|---|---|
| `morning run.mp4` | `morning run.jpg` |
| `kenya - sunrise trail.mp4` | `kenya - sunrise trail.png` |
| `coastal-walk.mp4` | `Coastal-Walk.jpg` *(capitalisation ignored)* |

If the names do not match, the video will appear without a thumbnail. When uploading through the admin form, the system automatically renames the thumbnail to match the video — so as long as you upload both files together in the same upload, you do not need to rename the thumbnail manually.

---

## Video File Requirements

| Property | Requirement |
|---|---|
| **Format** | `.mp4` only |
| **Recommended resolution** | **1280 × 720** (720p) |
| **Aspect ratio** | 16:9 (landscape) |
| **Recommended length** | Designed for treadmill workout sessions — typically 20–60 minutes |
| **File naming** | Use a clear name with no special characters (spaces are fine). The filename becomes the default title. |

> There is no hard file-size limit enforced by the upload form, but very large files will take longer to upload and stream. Full HD `.mp4` files compressed with H.264 are recommended for the best balance of quality and size.

---

## Thumbnail Image Requirements

| Property | Requirement |
|---|---|
| **Accepted formats** | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` |
| **Recommended resolution** | **1280 × 720** (720p) |
| **Naming convention** | The system will automatically name the thumbnail to match the video file. You do not need to worry about naming it yourself. |

> Thumbnails are optional. If you do not upload one, the video will appear without a preview image.

---

## Region Cover Images

Each region can have a cover image that users see on the video browsing page.

| Property | Requirement |
|---|---|
| **Accepted formats** | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` |
| **Recommended resolution** | **1280 × 720** |
| **Purpose** | Represents the region visually on the user-facing page |

You can upload or update a cover image at any time by clicking **Edit** next to a region on the Regions tab.

---

## Where Files Are Stored

You do not need to manage files manually — the system handles everything automatically on upload. For reference:

- **Videos** are stored in the `media/videos/{Region Name}/` folder on the server.
- **Thumbnails** are stored in the `media/images/{Region Name}/` folder on the server.
- The `media/` folder location on the server is set by your system administrator. If you are unsure where it is, ask whoever set up the server.

> Files are **not** stored on Google Drive, Dropbox, or any external service. They live directly on the server machine.

---

## Editing a Video

1. On the **Videos** tab, find the video you want to change.
2. Click **Edit** on that row.
3. You can update the **title**, **region**, and **visibility**.
4. You **cannot** replace the video file or thumbnail after upload. To swap either, delete the video and add it again as a new entry.
5. Click **Save** when done.

---

## Hiding vs. Deleting a Video

| Action | What happens |
|---|---|
| **Hide** (toggle Visible off) | The video stays in the system but users cannot see it. You can re-show it at any time. |
| **Delete** | Permanently removes the video record. The file on disk is not automatically deleted. Contact a technical admin if you also need the file removed from the server. |

---

## Searching and Filtering

On the Videos tab, you can:

- **Search** by typing part of a video title in the search box.
- **Filter by region** using the region dropdown.

This helps when you have many videos and need to find a specific one quickly.

---

## Previewing the User View

At the top right of the Video Manager page there is a **"View user side ↗"** link. Clicking it opens the user-facing video page in a new tab so you can see exactly what users will see.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| Navigating to `/admin/videos` redirects you away or shows "Forbidden" | Your account does not have the admin role. Ask your system administrator to assign it. |
| Upload fails with an error message | Check that the file is `.mp4` and that you selected a region. Try again; if it keeps failing, the file may be too large for the server's upload limit — contact a technical admin. |
| Video uploaded but has no thumbnail | The thumbnail filename did not match the video filename. Delete the video and re-upload both files together. |
| Region does not appear in the dropdown | Create the region first under the **Regions** tab, then come back to add the video. |
| Success message disappeared before you read it | Check the video list — if the new video appears in the table, the upload succeeded. |
| Deleted a video by mistake | The record is gone. The file may still exist on the server — contact a technical admin to restore it if needed. |

---

## Quick Reference Checklist for Adding a New Video

- [ ] Region exists (create it first if not)
- [ ] Video is in `.mp4` format
- [ ] Video is 1280 × 720 (720p), landscape
- [ ] Thumbnail prepared in `.jpg` or `.png` at 1280 × 720 (optional)
- [ ] Title is clear and descriptive
- [ ] Visible toggle is set correctly
- [ ] Upload confirmed with success message
